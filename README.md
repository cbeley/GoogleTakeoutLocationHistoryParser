# GoogleTakeoutLocationHistoryParser

`googleTakeoutLocationHistoryParser` is a CLI tool for extracting arbitrary date ranges from your [Google Takeout](https://takeout.google.com/settings/takeout) location history data. It also provides many options to let you control what details are extracted and what formats to output it to.

## Features

-   Generate KML and or geoJSON files with named points
    -   In other words, if you are at Fancy Restaurant, the point will have its name value set to "Fancy Restaurant".
-   Automatically split output files by a given entry limit (for importing into things like [Google My Maps](https://www.google.com/maps/d/))
-   Control what level of detail you want between stops.
-   TODO: Include or exclude dates
-   TODO: Cherry pick extra data to include (for geoJSON output only)
    -   placeId (Google's place id)
    -   activityType
    -   timeSpentAtLocation
    -   address (ex: "1058 Folsom Street, San Francisco, California 94103, United States")

## Installation

TODO -- will be via yarn/npm.

## The Problem

[Google Takeout](https://takeout.google.com/) lets you download all of your location history data -- which is quite extensive if you have it on and were not aware of it. The problem is the format is proprietary and not very useful for importing into your applications. You can't even import it into [Google My Maps](https://www.google.com/maps/d/).

In addition to the proprietary format, it also includes a single KML file with your entire location history. It has several problems though: it only has individual unnamed points, includes dates (which you may not want to include for privacy reasons), and is a large file that is annoying to work with.

The more observant may notice there is also a JSON export option. That file is about as equally unhelpful as the KML file -- though it does include "accuracy" and "source", which the KML file does not have.

## How to Retrieve Your Location History Data

Go to [Google Takeout](https://takeout.google.com/settings/takeout).

If you only want to include Location History in your takeout, click "Deselect all".

Ensure at least "Location History" is checked.

`googleTakeoutLocationHistoryParser` only uses the "Semantic Location History", which is only available in JSON, so you don't have to worry about changing the format. However, if you click "Multiple formats", then change the format to "KML", the resulting takeout zip file will be smaller.

Eventually you'll get an email with a link to download your take out. My history goes as far back as 2012 and it still only took about 5-10 minutes for me to get the email. Your results may vary.

## Example Usage

Note that the CLI should be pointed to your top-level google takeout directory, not the "Location History" folder.

### Output a geoJSON file with your entire location history.

```bash
googleTakeoutLocationHistoryParser path/to/googleTakeoutDirectory
```

A geoJSON file, `out.json` will be created with all the default options. You can change the output file name with `-o`:

```bash
googleTakeoutLocationHistoryParser -o myLocationHistory path/to/googleTakeoutDirectory
```

Be sure to omit any extension from your output name.

### Output both a geoJSON and KML file for a specific date range.

```bash
googleTakeoutLocationHistoryParser -k -o my-trip -sd 2021-04-30 -ed 2021-10-31 path/to/googleTakeoutDirectory
```

If you want to include further "waypoints" that Google records between locations, you can add the `-a` flag. This will give you a more complex output that may take longer to render. However, it will not increase the amount of entries in either the kml or geoJSON file (which may matter if you are importing it into some service like [Google My Maps](https://www.google.com/maps/d/)).

### Split the output into multiple files (so you can import into tools like Google My Maps)

Many services and APIs that take a KML or geoJSON file limit the amount of entries they can have per file. However, they may allow you to upload multiple files.

[Google My Maps](https://www.google.com/maps/d/) allows you to upload multiple files, but each file may only contain 2000 entries. You can work around this with the following command:

```bash
googleTakeoutLocationHistoryParser -k -eg -e 2000 -o my-trip -sd 2021-04-30 -ed 2021-10-31 path/to/googleTakeoutDirectory
```

The above will not output a geoJSON file (`-eg`), will output a KML file needed for [Google My Maps](https://www.google.com/maps/d/) (`-k`), and ensure that each file will only contain at most 2000 entries (`-e 2000`). The output will look something like `my-trip-1.kml`, `my-trip-2.kml`, etc.

Numbers in filenames will be left-padded as needed.

## Command-Line Options

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
