-- sql/seed_venues_v2.sql
-- Second-wave venue seed: suburban event centers, country clubs, universities,
-- corporate HQs, production studios, and additional entertainment venues.
--
-- Safe to re-run: ON CONFLICT (name, city) DO NOTHING. Existing rows are
-- left alone so any tier or notes edits made in the dashboard survive.
--
-- Run in: Supabase Dashboard -> SQL Editor -> New Query.
-- Verify after with:
--   SELECT count(*), tier FROM venues GROUP BY tier ORDER BY tier;

INSERT INTO venues (name, type, city, state, website_url, tier, notes) VALUES

-- ── Suburban event centers + hotels ──────────────────────────────────────────
('Edinborough Park',
  'event_center', 'Edina', 'MN',
  'https://www.edinborougharts.org/edinborough-park',
  2,
  'Indoor park hosting weddings, corporate parties, and civic events; consistent steady demand for guest shuttles.'),

('Calhoun Beach Club',
  'wedding_venue', 'Minneapolis', 'MN',
  'https://www.calhounbeachclub.com',
  2,
  'High-end lakeside weddings drawing out-of-town wedding parties; airport runs and shuttle work.'),

('Westwood Hills Nature Center',
  'wedding_venue', 'Saint Louis Park', 'MN',
  'https://www.stlouispark.org/government/departments-divisions/parks-recreation/parks-and-facility-rentals/westwood-hills-nature-center',
  3,
  'Boutique outdoor weddings, smaller scale; occasional single-vehicle bookings.'),

('Hilton Minneapolis/St. Paul Airport',
  'hotel', 'Bloomington', 'MN',
  'https://www.hilton.com/en/hotels/mspaphf-hilton-minneapolis-st-paul-airport',
  2,
  'Conference business and incoming corporate travel; high airport-to-hotel transfer volume.'),

('Renaissance Minneapolis Hotel The Depot',
  'hotel', 'Minneapolis', 'MN',
  'https://www.marriott.com/en-us/hotels/mspbr-renaissance-minneapolis-hotel-the-depot/overview/',
  2,
  'Downtown hotel hosting weddings and conventions in the historic train depot; steady guest transport.'),

-- ── Country clubs ────────────────────────────────────────────────────────────
('Minikahda Club',
  'wedding_venue', 'Minneapolis', 'MN',
  'https://www.minikahdaclub.org',
  2,
  'Private country club with member events and weddings; affluent guest list familiar with chauffeur service.'),

('Edina Country Club',
  'wedding_venue', 'Edina', 'MN',
  'https://www.edinacc.org',
  2,
  'Affluent membership; regular gala and wedding bookings, plus member-driven corporate events.'),

('Interlachen Country Club',
  'wedding_venue', 'Edina', 'MN',
  'https://www.interlachencc.org',
  1,
  'Top-tier country club with high-end private events and corporate outings; tournament-week demand.'),

('Minneapolis Golf Club',
  'wedding_venue', 'Saint Louis Park', 'MN',
  'https://www.mplsgolfclub.com',
  2,
  'Member events and weddings in an established west-metro club; recurring shuttle demand.'),

('Town and Country Club',
  'wedding_venue', 'Saint Paul', 'MN',
  'https://www.tcclub.org',
  2,
  'Saint Paul''s oldest country club; weddings and member galas with strong inbound travel.'),

-- ── Universities ─────────────────────────────────────────────────────────────
('University of Minnesota Twin Cities',
  'corporate', 'Minneapolis', 'MN',
  'https://www.umn.edu',
  1,
  'Major recruiting events, athletic department travel, and high-profile executive guest visits.'),

('University of St. Thomas',
  'corporate', 'Saint Paul', 'MN',
  'https://www.stthomas.edu',
  2,
  'Executive education programs, board members, and visiting speakers needing private transport.'),

('Macalester College',
  'corporate', 'Saint Paul', 'MN',
  'https://www.macalester.edu',
  3,
  'Liberal-arts speaker events and trustee meetings; smaller scale but reliable.'),

('Carleton College',
  'corporate', 'Northfield', 'MN',
  'https://www.carleton.edu',
  3,
  'Distance from Twin Cities makes MSP airport transfers a natural fit for visiting parents and trustees.'),

('St. Olaf College',
  'corporate', 'Northfield', 'MN',
  'https://www.stolaf.edu',
  3,
  'Same Northfield distance dynamic as Carleton; airport runs and event shuttle demand.'),

-- ── Corporate HQs ────────────────────────────────────────────────────────────
('UnitedHealth Group',
  'corporate', 'Minnetonka', 'MN',
  'https://www.unitedhealthgroup.com',
  1,
  'Fortune 5 HQ with frequent executive, board, and visiting-client transport.'),

('3M',
  'corporate', 'Maplewood', 'MN',
  'https://www.3m.com',
  1,
  'Fortune 100 HQ; recurring executive travel and customer-visit transport.'),

('Target Corporation',
  'corporate', 'Minneapolis', 'MN',
  'https://corporate.target.com',
  1,
  'Fortune 100 downtown HQ with high-volume executive and vendor transportation needs.'),

('Best Buy',
  'corporate', 'Richfield', 'MN',
  'https://corporate.bestbuy.com',
  1,
  'Fortune 100 HQ campus; vendor visits and senior-leadership travel are frequent.'),

('U.S. Bank',
  'corporate', 'Minneapolis', 'MN',
  'https://www.usbank.com',
  1,
  'Fortune 500 HQ; regular client-hosting and executive travel, especially around quarterly events.'),

('General Mills',
  'corporate', 'Golden Valley', 'MN',
  'https://www.generalmills.com',
  1,
  'Fortune 200 HQ; marketing and board events plus frequent executive travel.'),

('Ecolab',
  'corporate', 'Saint Paul', 'MN',
  'https://www.ecolab.com',
  2,
  'Fortune 500 HQ; customer hosting and executive transport throughout the year.'),

('Cargill',
  'corporate', 'Minnetonka', 'MN',
  'https://www.cargill.com',
  1,
  'Largest privately held US company; global executives in regularly, ideal for sustained transport contracts.'),

('Ameriprise Financial',
  'corporate', 'Minneapolis', 'MN',
  'https://www.ameriprise.com',
  2,
  'Fortune 250 HQ; advisor events, conferences, and executive travel.'),

('Medtronic',
  'corporate', 'Fridley', 'MN',
  'https://www.medtronic.com',
  2,
  'Fortune 200 medical devices HQ; frequent visiting-physician and conference-attendee transport.'),

-- ── Production / film ────────────────────────────────────────────────────────
('Twin Cities Public Television',
  'studio', 'Saint Paul', 'MN',
  'https://www.tpt.org',
  3,
  'Production crews and visiting on-air talent; smaller volume but recurring.'),

('Roller Garden Studios',
  'studio', 'Saint Louis Park', 'MN',
  'https://www.rollergardenstudios.com',
  3,
  'Indie production studio for film and photo shoots; cast and crew transport on shoot days.'),

-- ── Additional entertainment ─────────────────────────────────────────────────
('Surly Brewing Festival Field',
  'concert_hall', 'Minneapolis', 'MN',
  'https://surlybrewing.com/festival-field',
  2,
  'Outdoor concert venue with touring acts; artist and crew transport on show nights.'),

('Bayfront Festival Park',
  'concert_hall', 'Duluth', 'MN',
  'https://duluthmn.gov/parks/parks-listing/bayfront-festival-park/',
  3,
  'Major Duluth concerts; airport-transfer demand from MSP for touring talent.'),

('Mall of America',
  'event_center', 'Bloomington', 'MN',
  'https://www.mallofamerica.com',
  2,
  'Major events, corporate retreats, and celebrity appearances; high airport-transfer overlap.')

ON CONFLICT (name, city) DO NOTHING;
