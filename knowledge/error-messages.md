# OneSila error messages and fixes

STRICT RULES FOR CHEWBOT when a user pastes an error message:
- Match the error to the PATTERN below with the same structure. The property names, values and SKUs inside it will be different from the example.
- Reply with the FIX for that pattern, ONLY swapping in the exact property / value / SKU from the user's error. Keep the meaning and steps of the FIX exactly as written.
- Do NOT add any other solutions, alternative fixes, extra steps, tips, causes or background. Do NOT suggest changing property types or settings that the FIX doesn't mention.
- If the error contains several issues, give the FIX for each one as a short numbered list.
- If the error doesn't match any pattern here, say so and tell them to ask the real Chewis.

Placeholders: {PROPERTY} = property name, {VALUE} = value in the error, {SKU} = SKU(s) in the error.

---

## 1. Value below required minimum (Amazon code 90221)

PATTERN:
Amazon product has validation issues (1). - [90221] Value '{VALUE}' for '{PROPERTY}' below required minimum '{MIN}'. To fix this: (1) review minimum requirements; (2) update value to be greater than {MIN}; (3) resubmit with compliant value

EXAMPLE ERROR:
Amazon product has validation issues (1). - [90221] Value '0.' for 'Item Package Weight' below required minimum '0'. To fix this: (1) review minimum requirements; (2) update value to be greater than 0; (3) resubmit with compliant value

FIX:
The **{PROPERTY}** property cannot be {VALUE} (as everything weighs something). Change it to the rough weight of the product, **Save** and resync.

---

## 2. Attribute doesn't have enough values (Amazon code 99022)

PATTERN:
Amazon product has validation issues (1). - [99022] The field '{FIELD}' for the attribute '{PROPERTY}' does not have enough values. The required minimum is '{MIN}' value(s).

EXAMPLE ERROR:
Amazon product has validation issues (1). - [99022] The field 'aspect' for the attribute 'Hazmat Aspect' does not have enough values. The required minimum is '1' value(s).

FIX:
The **{PROPERTY}** property is empty. It needs to be filled out (it will always be **Not Applicable**).

---

## 3. Parent product already exists on the sales channel

PATTERN:
Parent product(s) with SKU(s) {SKU} already exist on this sales channel. Remove them before syncing this variation independently.

EXAMPLE ERROR:
Parent product(s) with SKU(s) SM-WORRY-YUMMY-PAR already exist on this sales channel. Remove them before syncing this variation independently.

FIX:
The product you're trying to sync is part of a parent that is already on the channel. Either resync the parent SKU (**{SKU}**) or make an alias of this product and sync that to the channel instead.

---

## 4. Select value is not mapped

PATTERN:
Required field '{FIELD}' maps to local property '{PROPERTY}', but select value '{VALUE}' is not mapped

EXAMPLE ERROR:
Required field 'hfssIndicator' maps to local property 'hfss_status', but select value 'Not in Scope' is not mapped

FIX:
The value **{VALUE}** for **{PROPERTY}** needs to be mapped. If you don't know how to map it, ask the real Chewis.

---

## 5. Product-level property has different values across variations

PATTERN:
Required field '{FIELD}' maps to local property '{PROPERTY}', which is a product-level property for configurable product {SKU}, but it has different values across active variations. Product-level properties must have the same value on every active variation. Active variation values: ...

EXAMPLE ERROR:
Required field 'regulatedProductName' maps to local property 'legal_product_name', which is a product-level property for configurable product WICKER-CELLO-BOW-PAR, but it has different values across active variations. Product-level properties must have the same value on every active variation. Active variation values: HAMPER+CELLO+BOW-LARGE='Large Wicker Basket with Cellophane and Pull Bow', HAMPER+CELLO+BOW-SMALL='Small Wicker Basket with Cellophane and Pull Bow'

FIX:
This means the **{PROPERTY}** property has different values across the variations. To fix it, make **{PROPERTY}** have the same value for all the variations.
