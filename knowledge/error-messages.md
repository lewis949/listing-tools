# OneSila error messages and simplified fixes

How to use this file (instructions for Chewbot):
- Users will often paste a OneSila sync error. Match it to the PATTERN below with the same structure (error code and wording); the property names, values and SKUs inside it will be different.
- Reply with the FIX for that pattern, swapping in the exact property / value / SKU from the user's error. Keep it short: what's wrong in plain English, then what to do.
- If the error contains several issues, explain each one as a short numbered list.
- If the error doesn't match any pattern here, say so and tell them to ask the real Chewis.

Placeholders: {PROPERTY} = property name, {VALUE} = value in the error, {MIN} = minimum allowed, {SKU} = SKU(s) in the error.

---

## 1. Value below required minimum (Amazon code 90221)

PATTERN:
Amazon product has validation issues (1). - [90221] Value '{VALUE}' for '{PROPERTY}' below required minimum '{MIN}'. To fix this: (1) review minimum requirements; (2) update value to be greater than {MIN}; (3) resubmit with compliant value

EXAMPLE ERROR:
Amazon product has validation issues (1). - [90221] Value '0.' for 'Item Package Weight' below required minimum '0'.

FIX:
The **{PROPERTY}** property is set to {VALUE}, which is too low. Amazon needs it to be more than {MIN}. Change **{PROPERTY}** to a sensible value above {MIN}, **Save**, then resync.
- If it's a weight property (e.g. Item Package Weight, Item Weight): it can't be 0 because everything weighs something. Enter the rough weight of the product.

---

## 2. Attribute doesn't have enough values (Amazon code 99022)

PATTERN:
Amazon product has validation issues (1). - [99022] The field '{FIELD}' for the attribute '{PROPERTY}' does not have enough values. The required minimum is '{MIN}' value(s).

EXAMPLE ERROR:
Amazon product has validation issues (1). - [99022] The field 'aspect' for the attribute 'Hazmat Aspect' does not have enough values. The required minimum is '1' value(s).

FIX:
The **{PROPERTY}** property is empty. Amazon requires it to be filled in. Open the product, fill in **{PROPERTY}**, **Save**, then resync.
- Hazmat Aspect: always set it to **Not Applicable**.

---

## 3. Parent product already exists on the sales channel

PATTERN:
Parent product(s) with SKU(s) {SKU} already exist on this sales channel. Remove them before syncing this variation independently.

EXAMPLE ERROR:
Parent product(s) with SKU(s) SM-WORRY-YUMMY-PAR already exist on this sales channel. Remove them before syncing this variation independently.

FIX:
The product you're trying to sync is part of a parent (**{SKU}**) that's already on this channel, so it can't be synced on its own. Either:
1. Resync the parent SKU **{SKU}**, or
2. Make an alias of this product and sync the alias to the channel instead.
