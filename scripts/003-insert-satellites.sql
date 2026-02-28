
BEGIN;

INSERT INTO satellites (norad_id, name, country, launch_date, object_type, data_source)
VALUES ('41328', 'NAVSTAR 76 (USA 266)', 'United States', '2016-02-05', 'PAYLOAD', 'Space-Track.org')
ON CONFLICT (norad_id) DO UPDATE SET
    name = EXCLUDED.name,
    country = EXCLUDED.country,
    object_type = EXCLUDED.object_type,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO satellites (norad_id, name, country, launch_date, object_type, data_source)
VALUES ('43689', 'METOP-C', 'Europe (EUMETSAT)', '2018-11-07', 'PAYLOAD', 'Space-Track.org')
ON CONFLICT (norad_id) DO UPDATE SET
    name = EXCLUDED.name,
    country = EXCLUDED.country,
    object_type = EXCLUDED.object_type,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO tle_data (satellite_id, norad_id, epoch, mean_motion, eccentricity, inclination, right_ascension, argument_of_perigee, mean_anomaly, tle_line1, tle_line2, bstar, data_source)
SELECT s.id, '41328', '2026-02-22T04:35:04.691328', 2.00557142, 0.00951630, 55.4485, 94.0183, 245.7125, 113.3595, 
  '1 41328U 16007A   26053.19102652  .00000008  00000-0  00000+0 0  9991',
  '2 41328  55.4485  94.0183 0095163 245.7125 113.3595  2.00557142 73537',
  0.0, 'Space-Track.org'
FROM satellites s WHERE s.norad_id = '41328';

INSERT INTO tle_data (satellite_id, norad_id, epoch, mean_motion, eccentricity, inclination, right_ascension, argument_of_perigee, mean_anomaly, tle_line1, tle_line2, bstar, data_source)
SELECT s.id, '43689', '2026-02-22T02:59:39.719328', 14.21491259, 0.00020260, 98.6800, 114.7592, 122.0004, 238.1371,
  '1 43689U 18087A   26053.12476527  .00000078  00000-0  55358-4 0  9999',
  '2 43689  98.6800 114.7592 0002026 122.0004 238.1371 14.21491259378484',
  0.0000055358, 'Space-Track.org'
FROM satellites s WHERE s.norad_id = '43689';

COMMIT;
