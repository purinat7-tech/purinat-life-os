import{R as s,V as a,at as o,x as e,k as i}from"./index-DBmcO55G.js";const t=()=>({title:"About",section:"about",body:i`
    ${o({eyebrow:"About",title:"How this site works",lead:"A personal, public log. Everything on it comes from JSON files in its repository."})}
    <div class="prose">
      <h2>Two modules</h2>
      <ul>
        <li><a href="${e("/speaklog")}">SPEAKLOG</a> treats English like endurance training: sessions, weekly volume, personal bests, a periodised plan and trip readiness.</li>
        <li><a href="${e("/miles")}">MILES</a> is a travel passport: a map, journeys, one hero photo per place, a timeline, a Dream Board and a yearly Wrapped.</li>
      </ul>

      <h2>Data rules</h2>
      <ul>
        <li>Numbers are calculated from the stored data only. Nothing is estimated, randomised or filled in. Empty sections say “No data yet”.</li>
        <li>“TODO” marks details that have not been added yet. TODO values never count in statistics.</li>
        <li>Places count as visits only after they are confirmed. Suggested places are labelled “Not confirmed”, get no map marker and are not counted.</li>
        <li>Races appear only as a badge on their journey. They never count in travel statistics, map counts or Wrapped.</li>
        <li>No passport numbers, booking references, flight numbers, accommodation addresses, payment details or contact details are stored. A build check rejects common patterns.</li>
        <li>Photos are resized, converted to WebP and stripped of all metadata (GPS location, camera details, timestamps) before they are published.</li>
        <li>Some place coordinates were looked up from public sources (Wikipedia, OpenStreetMap, official tourism pages) and are marked as not yet verified.</li>
      </ul>

      <h2>How SPEAKLOG numbers are calculated</h2>
      <ul>
        <li>Session Card scores are on a 0–5 scale. Charts show 0–100 (score × 20). Speaking = communication score; listening = listening score or comprehension %.</li>
        <li>Weeks run Monday to Sunday, Bangkok time. The streak counts consecutive days with at least one session, ending today or yesterday.</li>
        <li>Speaking sessions = speaking, storytelling and travel-simulation. Listening = listening and movie sessions.</li>
        <li>This week’s focus = the correction tag seen most in the last ${s} days.</li>
        <li>Trip readiness per scenario = average of the latest ${a} scored sessions for that scenario. Overall = average of practised scenarios.</li>
        <li>Pronunciation is not scored.</li>
      </ul>

      <h2 id="session-card">Session Card format</h2>
      <p>One JSON object per session. Required: <span class="code">id</span> (date + 3 digits, e.g. 2026-10-23-001), <span class="code">date</span>, <span class="code">type</span>, <span class="code">duration_min</span>, <span class="code">topic</span>. Optional: <span class="code">scores</span> (fluency, grammar, vocabulary, communication, listening; 0–5), <span class="code">strength</span>, <span class="code">focus</span>, <span class="code">corrections</span>, <span class="code">new_phrases</span>, <span class="code">coach_note</span>, <span class="code">scenario</span>, <span class="code">comprehension_pct</span>, <span class="code">library_id</span>. Types: speaking, listening, movie, reading, shadowing, travel-simulation, storytelling.</p>
      <p>Use the <a href="${e("/speaklog/import")}">import tool</a> to check a card and get the merged file to commit.</p>

      <h2>How MILES numbers are calculated</h2>
      <ul>
        <li>Countries and continents come from journeys and their confirmed places. Cities = the towns and areas listed on each journey. Places = confirmed visits only.</li>
        <li>Travel days = calendar days of each dated journey, first and last day included. Journeys without dates still count as journeys.</li>
        <li>Coffee shops, restaurants, hiking spots, beaches and photography spots count confirmed places tagged coffee, food, hiking, beach and photography.</li>
      </ul>

      <h2>Privacy</h2>
      <p>No login, no cookies, no analytics. The theme choice and any local preview of imported sessions are stored only in your own browser. Maps load tiles from the configured map provider, which receives your IP address like any web request.</p>

      <h2>Credits</h2>
      <p>Map rendering by MapLibre GL JS. Map data © OpenStreetMap contributors; tiles and attribution as shown on the map. Built with Vite and TypeScript.</p>
    </div>
  `});export{t as default};
