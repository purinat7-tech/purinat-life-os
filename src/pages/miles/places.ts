import { html } from '../../lib/html.ts';
import type { PageHandler } from '../../view.ts';
import { getPlaces } from '../../data.ts';
import { PLACE_CATEGORIES, type PlaceCategory } from '../../lib/types.ts';
import { humanizeTag } from '../../lib/speaklog.ts';
import { href } from '../../base.ts';
import { empty, milesHead } from '../../components/ui.ts';
import { placeCard } from './shared.ts';

const page: PageHandler = async ({ query }) => {
  const places = await getPlaces();
  const catParam = query.get('category');
  const category = PLACE_CATEGORIES.includes(catParam as PlaceCategory) ? (catParam as PlaceCategory) : null;
  const shown = category ? places.filter((p) => p.category.includes(category)) : places;
  const used = PLACE_CATEGORIES.filter((c) => places.some((p) => p.category.includes(c)));
  const withPhoto = places.filter((p) => p.photo && p.photo !== 'TODO').length;
  const confirmed = places.filter((p) => p.visit_confirmed).length;

  return {
    title: 'Places · MILES',
    section: 'miles',
    body: html`
      ${milesHead('/miles/places', 'Places', `One hero photo per place. ${confirmed} of ${places.length} visits confirmed · ${withPhoto} of ${places.length} photos added.`)}
      <nav class="chips scroll" aria-label="Filter by category">
        <a class="chip" href="${href('/miles/places')}" ${category === null ? html`aria-current="true"` : ''}>All <span class="count">${places.length}</span></a>
        ${used.map((c) => html`<a class="chip" href="${href(`/miles/places?category=${c}`)}" ${category === c ? html`aria-current="true"` : ''}>${humanizeTag(c)} <span class="count">${places.filter((p) => p.category.includes(c)).length}</span></a>`)}
      </nav>
      <div class="photo-grid mt">${shown.length ? shown.map((p) => placeCard(p, 2)) : empty('No data yet', 'Add places to data/places.json.')}</div>
    `,
  };
};

export default page;
