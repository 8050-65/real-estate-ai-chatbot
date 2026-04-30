# Property & Project Features Status

## Current Implementation Status

### ✅ What's WORKING

#### 1. Property Search (Frontend + Backend)
- **Frontend Hook**: `useProperties()` in `frontend/hooks/useProperties.ts`
- **Backend Endpoint**: `GET /api/v1/properties?search=...`
- **Backend Service**: `LeadService.searchProperties()`
- **Leadrat API**: `LeadratClient.searchProperties()` → `GET /property?PageNumber=1&PageSize=...`
- **Usage**: Can search properties by name/query in dashboard and AI assistant

#### 2. Project Search (Frontend + Backend)
- **Frontend Hook**: `useProjects()` in `frontend/hooks/useProperties.ts`
- **Backend Endpoint**: `GET /api/v1/projects?search=...`
- **Backend Service**: `LeadService.searchProjects()`
- **Leadrat API**: `LeadratClient.searchProjects()` → `GET /project/all?PageNumber=1&PageSize=...`
- **Usage**: Can search projects by name/query in dashboard

#### 3. Lead Creation with Properties/Projects
- **Leadrat API**: When updating lead status, can include:
  - `propertyIds`: Array of property IDs to link
  - `projectIds`: Array of project IDs to link
- **Implementation**: In `LeadratClient.updateLeadStatus()` (line 287-291)
- **Current Status**: Supported but not fully exposed in UI/chatbot

#### 4. Lead Details with Status
- **Endpoint**: `GET /api/v1/leads/{leadId}`
- **Leadrat API**: `LeadratClient.fetchLeadDetails()`
- **Returns**: Lead status, properties, projects, assignments, etc.

---

### ⚠️ What's PARTIALLY WORKING

#### 1. Chatbot Property/Project Search Flows
- **Status**: Defined in conversation state but NOT implemented
- **File**: `frontend/components/ai/ChatInterface.tsx` line 19
- **Flows defined**: `property_search`, `project_search`
- **Implementation**: Switch cases NOT found in chatbot handlers
- **Needed**: Implement property/project search flows in ChatInterface

#### 2. Property Linking to Lead
- **API Support**: Leadrat accepts `propertyIds` in lead status update
- **Backend Support**: Payload includes field (line 291)
- **Frontend Support**: Not fully exposed in UI
- **Needed**: UI flow to select and link properties when scheduling/updating

---

### ❌ What's NOT WORKING

#### 1. Create Property via Leadrat API
- **Status**: No backend endpoint
- **Why**: Requires Leadrat `/property` POST endpoint integration
- **Needed**: Add `LeadratClient.createProperty()` method
- **Leadrat API**: `POST /property` (need to verify structure)

#### 2. Create Project via Leadrat API
- **Status**: No backend endpoint
- **Why**: Requires Leadrat `/project` POST endpoint integration
- **Needed**: Add `LeadratClient.createProject()` method
- **Leadrat API**: `POST /project` (need to verify structure)

#### 3. Update Property
- **Status**: Not implemented
- **Why**: Would require Leadrat `PUT /property/{id}` endpoint
- **Needed**: Add `LeadratClient.updateProperty()` method

#### 4. Get Single Property Details
- **Status**: Not implemented
- **Why**: No `GET /property/{id}` endpoint in LeadratClient
- **Needed**: Add `LeadratClient.getPropertyDetails()` method

#### 5. Get Single Project Details
- **Status**: Not implemented
- **Why**: No `GET /project/{id}` endpoint in LeadratClient
- **Needed**: Add `LeadratClient.getProjectDetails()` method

#### 6. Link Property to Lead (UI Flow)
- **Status**: Not fully exposed
- **Why**: Chatbot doesn't have property selection flow
- **Needed**: Implement property selection in scheduling flow

#### 7. Link Project to Lead (UI Flow)
- **Status**: Not implemented
- **Why**: No chatbot flow for project selection
- **Needed**: Add project selection flow to chatbot

---

## What Leadrat APIs Are Available

Based on code inspection, Leadrat provides:

### Search APIs (IMPLEMENTED)
```
GET /lead?PageNumber=1&PageSize=10&SearchByNameOrNumber={query}
GET /property?PageNumber=1&PageSize=10&Search={query}
GET /project/all?PageNumber=1&PageSize=10&Search={query}
GET /lead/status?PageNumber=1&PageSize=50
GET /lead/{leadId}
```

### Lead Management (IMPLEMENTED)
```
POST /lead  (create lead)
PUT /lead/status/{leadId}  (update status + link properties/projects)
```

### Property Management (NEED VERIFICATION)
```
POST /property  (create property) - STRUCTURE UNKNOWN
PUT /property/{id}  (update property) - STRUCTURE UNKNOWN
GET /property/{id}  (get details) - NOT IMPLEMENTED
DELETE /property/{id}  (delete) - NOT IMPLEMENTED
```

### Project Management (NEED VERIFICATION)
```
POST /project  (create project) - STRUCTURE UNKNOWN
PUT /project/{id}  (update project) - STRUCTURE UNKNOWN
GET /project/{id}  (get details) - NOT IMPLEMENTED
DELETE /project/{id}  (delete) - NOT IMPLEMENTED
```

---

## Implementation Roadmap

### Phase 1: Property Search UI in Chatbot (1-2 hours)
**Goal**: Let users search properties in chatbot conversation

**Steps**:
1. Add `search_property` step in ChatInterface `handleScheduleFlow()`
2. Implement property search handler
3. Show property results as buttons
4. Store selected property in conversation state
5. Link property when confirming appointment

**Files to Modify**:
- `frontend/components/ai/ChatInterface.tsx`

**Result**: 
- User: "Schedule a site visit for 2 BHK under 50 lakhs"
- Bot: Searches properties, shows results
- User: Selects property
- Bot: Confirms appointment with property details

---

### Phase 2: Project Search UI in Chatbot (1-2 hours)
**Goal**: Let users search and view projects in chatbot

**Steps**:
1. Add `search_project` step in ChatInterface
2. Implement project search handler
3. Show project results (amenities, units, phases)
4. Allow viewing project details
5. Suggest properties from project

**Files to Modify**:
- `frontend/components/ai/ChatInterface.tsx`

**Result**:
- User: "Show projects with 3+ BHK units"
- Bot: Lists projects matching criteria
- User: Selects project
- Bot: Shows available units/phases

---

### Phase 3: Create Property via Leadrat (2-3 hours)
**Goal**: Create properties dynamically via Leadrat API

**Prerequisites**: You must provide Leadrat API structure for POST /property

**Steps**:
1. Create `LeadratClient.createProperty()` method
2. Create backend endpoint `POST /api/v1/properties`
3. Create PropertyService.createProperty()
4. Add chatbot flow for property creation
5. Test with Leadrat

**Example Needed**:
```json
{
  "name": "xyz apartments",
  "city": "Dubai",
  "bhk": 3,
  "price": 5500000,
  "area": 1850,
  // ... other fields?
}
```

**Files to Create/Modify**:
- `backend-java/src/main/java/com/leadrat/crm/leadrat/LeadratClient.java`
- `backend-java/src/main/java/com/leadrat/crm/lead/PropertyService.java` (create)
- `backend-java/src/main/java/com/leadrat/crm/lead/PropertyController.java`
- `frontend/components/ai/ChatInterface.tsx`

---

### Phase 4: Create Project via Leadrat (2-3 hours)
**Goal**: Create projects dynamically via Leadrat API

**Prerequisites**: You must provide Leadrat API structure for POST /project

**Similar to Phase 3** but for projects

---

## Questions for You

Since you mentioned "I have provided leadrat apis all", please clarify:

1. **Property Creation API**
   - What's the exact structure for `POST /property`?
   - What fields are required/optional?
   - What's the response structure?

2. **Project Creation API**
   - What's the exact structure for `POST /project`?
   - What fields are required/optional?
   - What's the response structure?

3. **Property Details API**
   - Is there a `GET /property/{id}` endpoint?
   - What fields does it return?

4. **Project Details API**
   - Is there a `GET /project/{id}` endpoint?
   - What fields does it return?

5. **Link Properties to Lead**
   - Should we link via lead status update (current approach)?
   - Or is there a separate endpoint?

6. **Link Projects to Lead**
   - Should we link via lead status update?
   - Or is there a separate endpoint?

---

## Current Capability Summary

| Feature | Status | Implementation Time |
|---------|--------|---------------------|
| Search Properties | ✅ DONE | - |
| Search Projects | ✅ DONE | - |
| Search in Chatbot (UI) | ⚠️ PARTIAL | 1-2 hours each |
| Create Property | ❌ TODO | 2-3 hours |
| Create Project | ❌ TODO | 2-3 hours |
| Get Property Details | ❌ TODO | 1 hour |
| Get Project Details | ❌ TODO | 1 hour |
| Link to Lead (API) | ✅ DONE | - |
| Link in Chatbot (UI) | ⚠️ PARTIAL | Included in phases 1-2 |

**Total Time If Full Implementation**: 8-12 hours
**Time If Only UI Flows**: 2-4 hours
**Time If Only Creation APIs**: 4-6 hours

---

## Recommendation for CEO Demo

**For CEO Demo** (next 2-3 hours):
1. Implement Property Search UI in Chatbot (Phase 1)
2. Show dummy properties in demo data
3. Allow selecting property during appointment scheduling
4. Demonstrate property linking to lead

**Post-Demo** (if needed):
1. Implement Creation APIs when you provide structures
2. Add more advanced property/project features
3. Full property management in dashboard

---

## Next Steps

1. **Provide Leadrat API Structures** for:
   - `POST /property` (create)
   - `POST /project` (create)
   - `GET /property/{id}` (details)
   - `GET /project/{id}` (details)

2. **Choose Priority**:
   - Demo Ready (2-3 hours): Search UI only
   - Full Featured (8-12 hours): All operations

3. **Confirm Requirements**:
   - Create properties in demo?
   - Create projects in demo?
   - Or just search/view existing ones?

Once you provide the API structures, I can implement any/all of these features.
