# Migration Guide: StreamIO to Huddle01

This document outlines the migration from StreamIO to Huddle01 for video conferencing in the PodX platform.

## Summary of Changes

1. Removed StreamIO dependencies and code
2. Added Huddle01 Server SDK integration
3. Updated call creation, joining, and management flows
4. Enhanced token gating with internal and external options
5. Implemented Huddle01 webhook handling

## Key Components Changed

- **Added**: `src/clients/huddle01.config.ts` - New Huddle01 client configuration
- **Added**: `src/controllers/huddle01.controller.ts` - New controller for Huddle01 endpoints
- **Added**: `src/routes/huddle01.routes.ts` - New routes for Huddle01 API
- **Updated**: `src/models/Mongodb/call.model.ts` - Updated Call model with Huddle01 specific fields
- **Updated**: `src/services/call.service.ts` - Replaced StreamIO calls with Huddle01
- **Updated**: `src/controllers/webhook.controller.ts` - Added Huddle01 webhook support
- **Updated**: `src/routes/webhook.routes.ts` - Added Huddle01 webhook endpoint
- **Removed**: `src/clients/streamio.config.ts` - StreamIO configuration

## Environment Variables

Add these to your `.env` file:

```
HUDDLE01_API_KEY=your_huddle01_api_key_here
HUDDLE01_PROJECT_ID=your_huddle01_project_id_here
```

## API Endpoint Changes

### New Endpoints

- **POST /huddle01/create** - Create a new Huddle01 call
  ```json
  {
    "title": "Meeting Title",
    "type": "video", // or "audio"
    "tokenGatedInfo": {
      "type": "internal", // or "external"
      "internal": {
        "pastRoomTitles": ["Past Room 1", "Past Room 2"]
      },
      "external": {
        "allowedWallets": ["wallet1", "wallet2"]
      }
    }
  }
  ```

- **GET /huddle01/token/:roomId** - Generate an access token for a room
- **GET /huddle01/details/:roomId** - Get details about a room

### Removed Endpoints

The following StreamIO-specific endpoints are now deprecated and will be removed in future versions:

- `/calls/stream/*` endpoints
- Any endpoints using StreamIO tokens

## Token Gating

The token gating system has been improved:

1. **Internal Gating**: Verifies if a user has attended past meetings (using POAPs)
2. **External Gating**: Checks if a user's wallet address is in an allowed list

## Webhook Configuration

1. Set up your Huddle01 webhooks in the Huddle01 dashboard
2. Point them to `https://your-api.com/webhooks/huddle01`
3. The webhook supports all Huddle01 event types:
   - `meeting:started`
   - `meeting:ended`
   - `peer:joined`
   - `peer:left`
   - `recording:started`
   - `recording:stopped`
   - `recording:updated`

## Frontend Changes Required

1. Update the API endpoint calls to use the new Huddle01 endpoints
2. Replace StreamIO token usage with Huddle01 tokens
3. Update any UI specific to StreamIO features

## Testing

1. Create a test meeting using the new Huddle01 endpoints
2. Test token generation
3. Test joining the meeting
4. Test internal/external token gating
5. Verify that webhooks are being processed correctly

## Future Improvements

1. Enhanced token gating with more advanced contract verification
2. Additional Huddle01 features like recording and livestreaming
3. Integration with POAP distribution system 