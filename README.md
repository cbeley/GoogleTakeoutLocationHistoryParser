# GoogleTakeoutLocationHistoryParser

Extra arbitrary date ranges from your location history into GeoJSON and or KML.

Work in progress! Check back soon!

Getting close the feature-set I want, but it currently works for everything described below. Better docs and such coming soon.

```
Usage: googleTakeoutLocationHistoryParser [options] <googleTakeoutDirectory>

Options:
  -e, --entries-per-file <value>
      The max amount of entries allowed per each kml and or geojson
      file. If unset, all entries will be in a single file.

  -k, --generate-KML                 Generate kml
  -eg, --exclude-geo-JSON
      If set, no geoJSON will be generated. By default, geoJSON
      is always generated otherwise.
  -p, --pretty-output
      If set, output will be more human readable.
      Applies to both JSON and KML.

  -sd, --start-date <ISODateString>
      Include entries after (inclusive) this date. If unset, you'll get
      results that go back as early as possible. If you do not specify a
      timezone offset, your computer's local timezone will be used.
      Partial ISO date strings are ok, but keep in mind if you leave
      out the time, the time will start at the very beginning of your date.

      ex:
          2021-01-01
          2021-01-01T14:30

  -ed, --end-date <ISODateString>
      Include entries before (inclusive) this date. If unset, you'll get
      results that go up to the present local time. If you do not specify
      a timezone offset, your computer's local timezone will be used.
      Partial ISO date strings are ok, but keep in mind if you leave out
      the time, the time will start at the very beginning of your date.

      ex:
          2021-01-01
          2021-01-01T14:30

  -s, --print-stats
      If set, some stats about what was parsed will be printed to the console.

  -o, --output-name <name>
      The output name to use.
      Numbers and extensions will be appended automatically.
      Numbers will also be left padded with zeros as needed.

      Ex:
          "-o foo" may become:

          "foo.kml"
          "foo.json"

          Or if '-e' is set:

          "foo-001.kml"
          "foo-001.kml"
          "foo-999.json"
          "foo-999.json"
   (default: "out")
  -a, --include-all-waypoints
      By default, only the beginning and end of activity segments
      are included. However, Google sometimes records waypoints
      between the beginning and end of an activity segment. By default
      these are not included, but can be added with this flag.

      The waypoints will be merged into LineString corresponding
      to the activity segment, so it will not increase the object
      count. However, you may not wantto turn this on if file size
      or processing is a concern. It'll also reveal more of your
      specific route, so it may not be desirable from a privacy
      stand-point as well.

  -V, --version                      output the version number
  -h, --help                         display help for command
```
