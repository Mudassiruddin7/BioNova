# BioNova AI Studio Backend API

## API Endpoints

### Gene & CRISPR Endpoints

#### Gene Prediction

- `POST /api/gene/predict` - Predict gene sequence modifications
  - Requires authentication
  - Request body: `{ "sequence": "ATCG..." }`

#### Gene Management

- `GET /api/gene` - Get all gene predictions for the authenticated user
- `GET /api/gene/:id` - Get a specific gene prediction by ID
- `PUT /api/gene/:id` - Update a gene prediction's metadata
- `DELETE /api/gene/:id` - Delete a gene prediction
- `POST /api/gene/:id/explanation` - Add an explanation to a gene prediction

#### CRISPR Analysis

The CRISPR analysis endpoints are available under two paths for backward compatibility:

##### Integrated Endpoints (Recommended)

- `POST /api/gene/crispr/analyze` - Analyze a single CRISPR edit
  - Request body: 
    ```json
    {
      "originalSequence": "ATCG...",
      "editedSequence": "ATCT...",
      "experimentMetadata": { /* optional metadata */ }
    }
    ```

- `POST /api/gene/crispr/batch-analyze` - Analyze multiple CRISPR edits
  - Request body:
    ```json
    {
      "edits": [
        {
          "originalSequence": "ATCG...",
          "editedSequence": "ATCT...",
          "experimentMetadata": { /* optional */ }
        },
        // Up to 10 edits
      ]
    }
    ```

- `POST /api/gene/crispr/compare` - Compare and rank multiple edit options
  - Request body:
    ```json
    {
      "originalSequence": "ATCG...",
      "editedSequences": ["ATCT...", "ATCA..."],
      "experimentMetadata": { /* optional */ }
    }
    ```

##### Legacy Endpoints (Deprecated)

The following endpoints provide the same functionality but are deprecated:

- `POST /api/crispr/analyze`
- `POST /api/crispr/batch-analyze`
- `POST /api/crispr/compare`

## Response Format

All API responses follow this format:

```json
{
  "statusCode": 200,
  "data": {
    // Response data here
  },
  "message": "Operation successful"
}
```

## Error Format

Errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "errors": [] // Optional array of detailed errors
}
``` 