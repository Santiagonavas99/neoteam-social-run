import assert from 'node:assert/strict'
import { test } from 'node:test'
import { copyPngToClipboard } from './composer-clipboard.ts'

type TestItem = { data: Record<string, Blob | Promise<Blob>> }

class FakeClipboardItem {
  data: Record<string, Blob | Promise<Blob>>

  constructor(data: Record<string, Blob | Promise<Blob>>) {
    this.data = data
  }
}

const Item = FakeClipboardItem as unknown as typeof ClipboardItem

test('writes image/png during the click, before asynchronous rendering finishes', async () => {
  const actions: string[] = []
  let finishRender: ((blob: Blob) => void) | undefined
  const render = () =>
    new Promise<Blob>((resolve) => {
      actions.push('render started')
      finishRender = resolve
    })
  const clipboard = {
    async write(items: ClipboardItem[]) {
      actions.push('clipboard.write')
      const item = items[0] as unknown as TestItem
      assert.ok(item)
      const promised = item.data['image/png']
      assert.ok(promised)
      const blob = await promised
      assert.equal(blob.type, 'image/png')
      assert.equal(await blob.text(), 'complete image')
    },
  }

  const copying = copyPngToClipboard(render, clipboard, Item)
  assert.deepEqual(actions, ['render started', 'clipboard.write'])
  assert.ok(finishRender)
  finishRender(new Blob(['complete image'], { type: 'image/png' }))
  await copying
})

test('does not copy when the browser lacks image clipboard support', async () => {
  let rendered = false
  await assert.rejects(
    copyPngToClipboard(
      async () => {
        rendered = true
        return new Blob(['png'], { type: 'image/png' })
      },
      undefined,
      undefined,
    ),
    /no permite copiar imágenes/,
  )
  assert.equal(rendered, false)
})

test('rejects invalid output and propagates clipboard permission errors', async () => {
  const clipboard = {
    async write(items: ClipboardItem[]) {
      const item = items[0] as unknown as TestItem
      await item.data['image/png']
    },
  }
  await assert.rejects(
    copyPngToClipboard(async () => new Blob(['jpeg'], { type: 'image/jpeg' }), clipboard, Item),
    /PNG/,
  )
  await assert.rejects(
    copyPngToClipboard(
      async () => new Blob(['png'], { type: 'image/png' }),
      {
        async write() {
          throw new Error('NotAllowedError')
        },
      },
      Item,
    ),
    /NotAllowedError/,
  )
})
