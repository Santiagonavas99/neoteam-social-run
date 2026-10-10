import assert from 'node:assert/strict'
import test from 'node:test'
import {
  alliedRaceMarqueeItems,
  organizationMarqueeItems,
  runningCrewMarqueeItems,
} from './community-marquees.ts'
import type { CommunityLogo, HomeLogoCarouselItem } from './data.ts'

const logos: CommunityLogo[] = [
  {
    id: 'crew-1',
    name: 'Neo Runners',
    logo_url: null,
    instagram: '@neo.runners',
    sort_order: 1,
  },
  {
    id: 'brand-1',
    name: 'Marca aliada',
    logo_url: 'https://example.com/brand.png',
    type: 'sponsor',
    sort_order: 0,
  },
  {
    id: 'org-1',
    name: 'Organización',
    logo_url: 'https://example.com/org.png',
    type: 'organizer',
    website: 'https://org.example',
    instagram: '@org',
    sort_order: 2,
  },
]

const allies: HomeLogoCarouselItem[] = [
  {
    id: 'ally-crew',
    name: 'Marca para correr',
    logo_url: 'https://example.com/crew.png',
    link_url: 'https://crew.example',
    active: true,
    sort_order: 0,
    show_in_races: false,
    show_in_running_crews: true,
    show_in_organizations: false,
  },
  {
    id: 'ally-org',
    name: 'Marca para organizar',
    logo_url: 'https://example.com/organizer.png',
    link_url: 'https://organizer.example',
    active: true,
    sort_order: 1,
    show_in_races: false,
    show_in_running_crews: false,
    show_in_organizations: true,
  },
  {
    id: 'ally-hidden',
    name: 'Aliado oculto',
    logo_url: 'https://example.com/hidden.png',
    link_url: null,
    active: false,
    sort_order: 3,
    show_in_races: false,
    show_in_running_crews: true,
    show_in_organizations: true,
  },
]

test('running crews includes only allies enabled for its strip and preserves ordering', () => {
  const items = runningCrewMarqueeItems(logos.slice(0, 1), allies)
  assert.deepEqual(
    items.map(({ id }) => id),
    ['ally-ally-crew', 'crew-1'],
  )
  assert.equal(items[0]?.website, 'https://crew.example')
})

test('organizations includes organizers and its selected allies, excluding sponsors', () => {
  const items = organizationMarqueeItems(logos, allies)
  assert.deepEqual(
    items.map(({ id }) => id),
    ['ally-ally-org', 'org-1'],
  )
  assert.equal(items[0]?.website, 'https://organizer.example')
})

test('a native record wins duplicate names and logo URLs', () => {
  const native = [
    {
      id: 'crew-2',
      name: '  Club Río ',
      logo_url: 'https://example.com/native.png',
      sort_order: 3,
    },
  ]
  const ally = allies[0]
  assert.ok(ally)
  const byName = {
    ...ally,
    id: 'same-name',
    name: 'club rio',
    show_in_running_crews: true,
    sort_order: 0,
  }
  const byLogo = {
    ...ally,
    id: 'same-logo',
    name: 'Other name',
    logo_url: 'https://example.com/native.png?width=300',
    show_in_running_crews: true,
    sort_order: 1,
  }

  assert.deepEqual(
    runningCrewMarqueeItems(native, [byName, byLogo]).map(({ id }) => id),
    ['crew-2'],
  )
})

test('each inclusion flag is independent and inactive allies stay hidden', () => {
  assert.deepEqual(
    runningCrewMarqueeItems([], allies).map(({ id }) => id),
    ['ally-ally-crew'],
  )
  assert.deepEqual(
    organizationMarqueeItems([], allies).map(({ id }) => id),
    ['ally-ally-org'],
  )
})

test('races reuse the same brand logo without duplicating a stored record', () => {
  const source = allies[0]
  assert.ok(source)
  const reusable = { ...source, show_in_races: true }
  const result = alliedRaceMarqueeItems([], [reusable])
  assert.equal(result.length, 1)
  assert.equal(result[0]?.id, 'ally-ally-crew')
  assert.equal(result[0]?.logo_url, reusable.logo_url)
  assert.equal(result[0]?.website, reusable.link_url)
})

test('races skip inactive brands and deduplicate native race names or images', () => {
  const reusable = { ...allies[0], show_in_races: true }
  assert.ok(reusable)
  const native = { ...reusable, id: 'race-1', show_in_races: false, sort_order: 0 }
  assert.deepEqual(
    alliedRaceMarqueeItems([native], [reusable]).map(({ id }) => id),
    ['race-1'],
  )
  assert.deepEqual(
    alliedRaceMarqueeItems([], [{ ...reusable, active: false }]),
    [],
  )
})

test('race flag does not add logos to crews or organizations', () => {
  const source = allies[0]
  assert.ok(source)
  const onlyRace = {
    ...source,
    show_in_races: true,
    show_in_running_crews: false,
    show_in_organizations: false,
  }
  assert.ok(onlyRace)
  assert.equal(alliedRaceMarqueeItems([], [onlyRace]).length, 1)
  assert.deepEqual(runningCrewMarqueeItems([], [onlyRace]), [])
  assert.deepEqual(organizationMarqueeItems([], [onlyRace]), [])
})
