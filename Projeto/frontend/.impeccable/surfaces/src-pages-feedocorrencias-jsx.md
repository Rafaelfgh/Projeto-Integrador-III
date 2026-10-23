---
version: 1
slug: "src-pages-feedocorrencias-jsx"
primary_target: "src/pages/FeedOcorrencias.jsx"
related_targets: ["src/components/Sidebar.jsx","src/pages/Login.jsx"]
---

# Surface: Habitare app (logged-in screens + login)

Mode: Operate (login: Persuade-light, same world). Audience: síndico and funcionário (heaviest daily use, phone and notebook), morador (most numerous, phone). Job: open, triage, follow and close condominium requests without losing any.
Constraints: Habitare orange #f47920 is the only brand accent for every profile; fixed status colours (Aberta red, Em Análise blue, Em Andamento amber, Concluída green); animate only opacity/transform; reduced-motion respected; must work at 390px and 1280–1600px.

## Direction contract

THESIS: Habitare speaks the language of the building's own signs: every request is identified the way the building identifies places — a plate with the unit or area set in large numerals, a pictogram for the trade, and a status band like a sign strip. It refuses the category default of identical white cards with pastel pills and a per-role accent.

OWN-WORLD: anodised-aluminium ground (#EDEEF0), white plates, sign-black ink (#121417) for the shell, plates' pictogram tiles and primary numerals, Habitare orange as the one sign colour for brand, primary action and "needs you" markers; 1px hairlines (#D6D8DC) separate, no colored side bars, no soft halos. Poppins 700–800 for titles and plate numerals (tabular), Plus Jakarta Sans for reading and fields. Pictograms from one stroke icon family on black square tiles.

STORY: the visitor recognises at a glance where each problem is (floor/unit/area), what trade it is, and in which stage it sits; then acts with the control that is always in the same place.

FIRST VIEWPORT: Mural on a 390px phone — sign-black top band with the screen title and the condominium name under it; tabs Em aberto / Concluídas; a stack of occurrence plates: left the location plate (label "Andar" / "Apto" / "Área comum" over a large numeral or short code), right the black pictogram tile, then title and one-line description, then the full-width status band (colour of the status, status name + protocol) at the card foot; primary action "Nova ocorrência" in orange within thumb reach. Desktop keeps the sidebar (sign-black) and lays plates in a responsive grid.

FORM: Sinalização Predial (impeccable's pick, rank 1 of my ordered list; the roll assigned rank 7, Prancha de Arquitetura; the user chose the pick). seed:17bc7fc758604f65. Signature move: the location plate + status band on every occurrence, carried into dashboards as numbered plates per status. Motion grammar: plates rise 8px and fade in a 40ms stagger (ease-out-quint, 280ms) on first render; pressed plates and buttons scale to .98; the status band text slides up like a changing sign when status changes.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
