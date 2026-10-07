import assert from 'node:assert/strict'
import test from 'node:test'
import type { CommunityLogo } from './data.ts'
import { organizationMarqueeItems, runningCrewMarqueeItems } from './community-marquees.ts'

const logos: CommunityLogo[] = [
  {
    id: 'crew-1',
    name: 'Neo Runners',
    logo_url: null,
    instagram: '@neo.runners',
  },
  {
    id: 'brand-1',
    name: 'Marca aliada',
    logo_url: 'https://example.com/brand.png',
    type: 'sponsor',
    website: 'https://brand.example',
  },
  {
    id: 'org-1',
    name: 'Organización',
    logo_url: 'https://example.com/org.png',
    type: 'organizer',
    website: 'https://org.example',
    instagram: '@org',
  },
]

test('running crew marquee preserves names, logos, and social links', () => {
  assert.deepEqual(runningCrewMarqueeItems(logos.slice(0, 1)), [
    {
      id: 'crew-1',
      name: 'Neo Runners',
      logo_url: null,
      website: undefined,
      instagram: '@neo.runners',
    },
  ])
})

test('organization marquee includes organizers and excludes other brands', () => {
  assert.deepEqual(
    organizationMarqueeItems(logos).map(({ id }) => id),
    ['org-1'],
  )
  assert.equal(organizationMarqueeItems(logos)[0]?.website, 'https://org.example')
})
