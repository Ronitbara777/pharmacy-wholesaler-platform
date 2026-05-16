# Receipt OCR Scanning Feature Guide

## Overview
The Receipt OCR feature allows users to scan pharmacy receipts using their mobile device camera, automatically extract item details (product name, quantity, price), and save them as bulk stock movements.

## Features

### 1. **Image Capture**
- Launch camera from "Scan Receipt" button
- Take photo of receipt
- Automatic image quality: 70% (optimized for OCR and upload speed)

### 2. **Automatic Text Extraction**
- Uses **Tesseract.js** on backend for OCR
- Extracts invoice number, customer/party name, and items
- Supports flexible item formats:
  - `Product Name x 5 100.50` (name x quantity price)
  - `Product Name 5 100.50` (name quantity price)
  - `Product Name 100.50 5` (name price quantity)

### 3. **Smart Price Normalization**
- Handles prices with commas: `100,50` → `100.50`
- Handles currency symbols: `₹100.50` → `100.50`
- Returns `null` for unparseable prices

### 4. **Editable Preview**
- Shows scanned receipt image
- Displays extracted items in editable table format
- Fields per item:
  - Product name (auto-extracted)
  - Batch number (optional, auto-extracted if present)
  - Quantity (numeric, validated on save)
  - Price (numeric, auto-calculated for total if quantity × price provided)
  - Notes (free text)
- Add/Remove items manually
- Edit invoice number and customer/party name

### 5. **Batch Save**
- All receipt items saved in single transaction
- Automatic product lookup by:
  - Product ID (if provided)
  - Batch number (exact match)
  - Product name (case-insensitive contains match)
- Automatic product quantity updates
- Low-stock notifications created if quantity drops below reorder level

## API Endpoints

### Scan Receipt Image
```
POST /api/v1/movements/scan
Content-Type: multipart/form-data

Request:
- receiptImage: File (image/jpeg or image/png)

Response:
{
  success: true,
  data: {
    text: "extracted raw OCR text",
    items: [
      {
        productName: "Product Name",
        quantity: 5,
        price: 100.50,
        batchNumber: "",
        notes: ""
      }
    ],
    invoiceNo: "INV-123456",
    party: "Customer Name"
  }
}
```

### Save Batch Movements
```
POST /api/v1/movements/batch
Content-Type: application/json

Request:
{
  items: [
    {
      type: "STOCK_IN" | "STOCK_OUT",
      productName: "Product Name",
      productId: "uuid" (optional),
      batchNumber: "BATCH123",
      quantity: 5,
      price: 100.50,
      party: "Customer Name" (for STOCK_OUT),
      invoiceNo: "INV-123456",
      notes: "",
      totalAmount: 502.50
    }
  ]
}

Response:
{
  success: true,
  message: "Processed 5 of 5 receipt items",
  data: {
    processed: 5,
    errors: [],
    items: [
      { id, type, quantity, productId, ... }
    ]
  }
}
```

## Usage Flow

### Step 1: Navigate to Stock In/Out Screen
- Select STOCK_IN or STOCK_OUT mode
- Click "Scan Receipt" button

### Step 2: Capture Receipt Image
- Camera opens automatically
- Take clear photo of receipt (avoid shadows/glare)
- Tap to confirm or retake

### Step 3: Review Extracted Data
- Receipt image displayed at top
- Auto-extracted items shown in table format
- Invoice number and customer name pre-filled if found
- Raw OCR text available in backend response

### Step 4: Edit (Optional)
- Correct any OCR extraction errors in the table
- Add batch numbers if missing
- Adjust prices or quantities
- Add internal notes
- Click "Add Item" to manually add unrecognized items
- Click trash icon to remove unwanted items

### Step 5: Save
- Click "Save Items"
- Backend validates each item and creates movements
- Product quantities auto-updated
- Low-stock alerts created if needed
- Success message shows count of saved items
- Recent movements list refreshes

## Error Handling

### Scanner Errors
- **No receipt image uploaded**: User cancelled camera/image pick
- **Failed to scan receipt or parse text**: OCR processing failed (try clearer image)
- **Camera permission required**: Request camera permission first

### Batch Save Errors
- **Product not found**: Product name doesn't match any in database
  - Solution: Correct product name or use product ID lookup
- **Insufficient quantity**: STOCK_OUT quantity exceeds available stock
  - Solution: Reduce quantity or add available stock first
- **Invalid quantity**: Quantity must be number > 0
  - Solution: Enter valid numeric quantity

### Partial Success
- If 5 items provided and 3 fail validation, 2 are still saved
- Error details shown per item with reason
- User can retry failed items in new batch

## Best Practices

### Capturing Receipt
1. **Lighting**: Use natural or bright lighting, avoid shadows
2. **Angle**: Take photo straight-on, not at angle
3. **Distance**: Fill frame with receipt, but include all items
4. **Quality**: Keep camera steady, avoid blurred images
5. **Orientation**: Portrait orientation works best

### Receipt Format for OCR
OCR works best with receipts that list items as:
```
Product Name    Qty    Price
Paracetamol     5      100.50
Aspirin Batch1  3      50.00
```

Avoid:
- Receipts with heavy graphics/logos that obscure text
- Small/compressed text
- Handwritten items
- Complex multi-column layouts

### Data Review
1. **Always review extracted data** - OCR can misread similar characters
2. **Verify quantities** - Common OCR errors: 0→O, 1→I, 5→S
3. **Check prices** - Ensure decimal points are correct
4. **Validate product names** - Must match database for auto-matching

## Technical Details

### OCR Processing
- **Library**: Tesseract.js v4.0.2
- **Language**: English
- **Processing**: Synchronous on backend
- **Performance**: ~2-5 seconds per image (varies by image size/quality)

### Pattern Matching
Receipt items parsed with regex patterns:
1. `^(.*?)\s+x\s*(\d+)\s+([0-9]+(?:[.,][0-9]{2})?)$` - Name x Qty Price
2. `^(.*?)\s+(\d+)\s+([0-9]+(?:[.,][0-9]{2})?)$` - Name Qty Price
3. `^(.*?)\s+([0-9]+(?:[.,][0-9]{2})?)\s+(\d+)$` - Name Price Qty

### Database Transaction
- All items saved in single Prisma transaction
- If any item creation fails, entire batch fails (rollback)
- Product quantity updates atomic with movement creation
- Activity log created for entire batch import

### Low-Stock Triggers
- Automatic notification if STOCK_OUT moves product below reorder level
- Notification includes current quantity and reorder level
- Users can set reorder level per product in inventory

## Troubleshooting

### "Receipt scan failed - Try again with a clearer image"
- Receipt image unclear or too small
- Solution: Retake photo with better lighting/focus

### "Product not found"
- Extracted product name doesn't match any in database
- Solution: Edit product name in preview to match database exactly

### "Insufficient quantity"
- Stock OUT quantity exceeds available
- Solution: Check available quantity in recent movements or reduce quantity

### "No receipt image uploaded"
- Camera/picker cancelled without selecting image
- Solution: Try again, ensure camera permissions granted

### Items not saving
- Check error details in response
- Each item error shows specific reason
- Manually create items with correct product IDs as workaround

## Limitations

1. **OCR Accuracy**: Depends on receipt quality and text clarity
   - Typical accuracy: 85-95% for clean receipts
   - Lower for worn/faded receipts

2. **Pattern Matching**: Only recognizes common item format patterns
   - Complex receipt layouts may not parse correctly
   - Manual editing required for unusual formats

3. **Language**: Currently English only
   - Future: Support for other languages via model selection

4. **Image Size**: Processed as-is, no size limit but optimize for speed
   - Recommended: <3MB, 800x1200px minimum

5. **Batch Size**: No hard limit but typically tested with 20-50 items/receipt
   - Very large batches (100+) may timeout on some connections

## Future Enhancements

- [ ] Multi-language OCR support
- [ ] Barcode/product code scanning
- [ ] Receipt template detection
- [ ] Automatic bundle/combo parsing
- [ ] Historical receipt storage
- [ ] Receipt sharing between users
- [ ] Auto-matching against supplier invoices
