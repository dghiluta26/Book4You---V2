# Wireframes

Low-fidelity layouts of the main screens, documenting the implemented structure. The real screens
are in [screenshots](../screenshots.md). Visual rules: green navbar and footer (#385144), cream
background (#F8F5F2), white cards with 18 px radius, Poppins.

## Home

```text
+--------------------------------------------------------------------+
| Book4You          Home  Accommodations      RO|EN [Login][Sign Up] |
+--------------------------------------------------------------------+
|                    (photo with dark overlay, 90vh)                 |
|                      Find your next stay                           |
|         Search the classic way, or tell the assistant              |
|   +------------------------------------------------------------+   |
|   | [Where to?     ] [Check-in] [Check-out] [Guests] (Search)  |   |
|   +------------------------------------------------------------+   |
|                ...or describe your trip to the assistant           |
+--------------------------------------------------------------------+
| Footer: brand | explore | account | about                          |
+--------------------------------------------------------------------+
```

## Results (desktop)

```text
+--------------------------------------------------------------------+
| Navbar                                                             |
+--------------------------------------------------------------------+
| Travel assistant                                    (Start over)   |
|  [ describe your trip ...                              ] (Send)    |
|  chips: (Brasov x) (14-16 Mar x) (4 guests x) (<= 600 x) (Cabin x) |
+----------------+--------------------------+------------------------+
| Filters        | 8 stays found   Sort [v] |                        |
|  City          | +----------------------+ |        MAP             |
|  Check-in/out  | | photo       [type]   | |   (380)   (420)        |
|  Guests        | | title, city, price   | |      (95)              |
|  Price min/max | +----------------------+ |           (1100)       |
|  Types (chips) | +----------------------+ |                        |
| (Apply)(Reset) | | card ...             | |  price markers synced  |
|                | +----------------------+ |  with the cards        |
|                |   < 1 2 3 >              |                        |
+----------------+--------------------------+------------------------+
```

## Results (phone)

```text
+--------------------------+
| Book4You   Home  Stays   |
| RO|EN        [Login] ... |
+--------------------------+
| Assistant + chips        |
| (      Filters       )   |
| 8 stays   [List | Map]   |
| Sort [v]                 |
| +----------------------+ |
| | card                 | |
| +----------------------+ |
+--------------------------+
```

## Accommodation details and booking

```text
+--------------------------------------------------------------------+
| < Back to results                                                  |
| [type]  Title                                                      |
| city, country                                                      |
| +------------------------------------+  +------------------------+ |
| |            main photo              |  | 520 RON / night        | |
| +------------------------------------+  | Step 1 of 3            | |
| [thumb] [thumb] [thumb]                 | [check-in][check-out]  | |
| (guests) (bedrooms) (bathrooms)         | [guests]               | |
| About this stay ...                     | Available: 3 nights    | |
| Amenities (chips)                       | (Book now)             | |
| Location (map)                          +------------------------+ |
+--------------------------------------------------------------------+

Step 2: summary (dates, guests, nights, total)  -> (Confirm) (Change dates)
Step 3: "Booking confirmed"                     -> (View my bookings)
```

## My bookings

```text
+--------------------------------------------------------------------+
| My bookings                                                        |
| +--------+-------------------------------------------[Confirmed]-+ |
| | photo  | Title, city                                           | |
| |        | dates, nights, guests, total     (Cancel booking)     | |
| +--------+-------------------------------------------------------+ |
+--------------------------------------------------------------------+
```
