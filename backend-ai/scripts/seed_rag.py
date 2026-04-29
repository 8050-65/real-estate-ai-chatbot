#!/usr/bin/env python
"""
Seed ChromaDB with real estate knowledge documents.

This script populates the RAG system with real estate information
that Ollama can use to answer general questions about properties,
projects, RERA regulations, payment plans, etc.

Usage:
    python scripts/seed_rag.py

Run this once after setting up the project to initialize the knowledge base.
"""

import asyncio
import sys
import json
from pathlib import Path

# Add parent directory to path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.rag.indexer import get_indexer
from app.utils.logger import get_logger, setup_logging

logger = get_logger(__name__)

# Real estate knowledge documents
REAL_ESTATE_DOCS = [
    {
        "content": """
PAYMENT PLANS FOR REAL ESTATE PROJECTS:

1. Construction Linked Plan (CLP) - Standard Payment Plan:
   - Buyer pays as construction progresses
   - 10% at booking → 20% at foundation → 20% at slab → 20% at brickwork → 20% at finishing → 10% at possession
   - Equitable distribution of payments with construction
   - Most common for residential projects

2. Time Linked Plan (TLP) - Fixed Schedule Payment:
   - Fixed payment dates regardless of construction progress
   - Buyer pays on predetermined dates
   - More predictable for builders
   - Less flexible for buyers if construction delays

3. Down Payment Plan - Upfront Heavy:
   - Pay 95% upfront, get 5-7% discount
   - Only 5% remaining at possession
   - Good for investors with capital
   - Not recommended for retail buyers

4. Subvention Scheme - Builder Funded EMI:
   - Builder pays EMI during construction period
   - Customer only pays 10-15% booking amount upfront
   - EMI burden starts only after possession
   - Popular for affordable housing schemes

TAXES AND CHARGES:
- GST: 5% applicable on under-construction properties, exempt on ready-to-move
- Stamp Duty: 5-6% of property value (varies by state/location)
- Registration Fee: 1% of property value
- Additional registration charges apply in some states

LOAN & FINANCING OPTIONS:
- Eligible for Home Loan (up to 80% of property value)
- Loan Against Property for refinancing
- Some builders offer direct financing at competitive rates
- EMI tenure typically 20-25 years
""",
        "metadata": {"type": "payment_plan", "source": "Real Estate Knowledge", "project": "General"}
    },
    {
        "content": """
RERA (REAL ESTATE REGULATORY AUTHORITY) - BUYER PROTECTION:

WHAT IS RERA?
- RERA is a statutory body established under the Real Estate (Regulation and Development) Act, 2016
- Governs all real estate transactions and developer conduct
- Provides legal recourse and consumer protection

REGISTRATION REQUIREMENTS:
- Mandatory for ALL projects with area > 500 sqm or > 8 units
- Must register on state RERA portal before advertising
- Registration certificate must be displayed at site office
- RERA number format: varies by state (e.g., PRM/KA/RERA/2022/001 for Karnataka)

BUILDER OBLIGATIONS UNDER RERA:
- Deposit 70% of collections in escrow account (held by banks)
- Cannot use funds until construction milestone reached
- Must provide Assured Returns if committed
- Responsible for delays (compensation to buyers)
- Must complete project as per approved plans

BUYER PROTECTIONS:
- Can file complaints on rera.gov.in or state portal
- Complaint resolution within 60 days
- Refund protection if project not completed
- Interest on delayed refunds: SBI PLR + 2% per annum

DELAY PENALTY:
- Builder pays interest to buyer: SBI PLR + 2% per month if project delayed
- If delay > 1 year: Buyer can demand FULL REFUND + interest + compensation
- Buyer can exit project without penalty if excessive delay

RERA PORTALS BY STATE:
- Karnataka: rera.karnataka.gov.in
- Maharashtra: maharerait.mahaonline.gov.in
- Delhi: delhirera.in
- Bangalore: bhoomirega.karnataka.gov.in

COMPLAINT PROCESS:
1. File complaint on RERA portal with proof
2. Pay complaint fee (varies by state)
3. RERA investigates within 30-60 days
4. Resolution issued by adjudicating officer
5. Appeal possible within 60 days
""",
        "metadata": {"type": "rera_legal", "source": "Real Estate Knowledge", "project": "General"}
    },
    {
        "content": """
COMMON AMENITIES IN PREMIUM RESIDENTIAL PROJECTS:

OUTDOOR & RECREATIONAL FACILITIES:
- Landscaped Gardens with themed designs
- Jogging Track (typically 400-800m)
- Children's Play Area (age-appropriate equipment, safety certified)
- Badminton Court (single or double courts)
- Tennis Court
- Basketball Court
- Cycling Track
- Open Air Theater / Amphitheater
- Picnic Area with BBQ facilities
- Multipurpose Sports Court (volleyball, badminton, basketball)
- Pool Table / Billiards Room

WELLNESS & FITNESS:
- Fully Equipped Gymnasium with modern cardio and strength equipment
- Yoga & Meditation Studio (dedicated space)
- Swimming Pool with temperature control
- Spa and Sauna facilities
- Martial Arts / Boxing Ring
- Aerobics Studio with sprung flooring
- Jacuzzi / Hot tub

SOCIAL & COMMUNITY:
- Clubhouse with lounge and seating
- Banquet Hall / Community Center (seats 100-500 people)
- Cafeteria / Coffee Shop
- Mini Theater / Home Theater
- Library & Reading Room
- Games Room with indoor games
- Lounge areas at various levels

BUSINESS & CO-WORKING:
- Co-working Space (equipped with desks, high-speed internet)
- Business Center with meeting rooms
- Conference Room (with audio-visual setup)
- Incubation Space for startups

INFRASTRUCTURE:
- 24/7 Security with CCTV surveillance (AI-powered)
- Gated community with multiple entry points
- Guard rooms and gatekeeping
- Hi-Speed Elevators (8-10 person capacity, destination control)
- Generator backup for common areas (24/7 power)
- Covered Parking (1-2 slots per unit)
- Visitor Parking with dedicated area
- EV Charging Points (electric vehicle charging stations)
- Water Harvesting & RWH systems
- Solid Waste Management
- Fiber-to-Home connectivity
- High-speed Internet provision

FAMILY AMENITIES:
- Crèche / Day Care Center
- Children's School (in some mega projects)
- Women's Safety features (designated zones, emergency call system)
- Pet Park for dogs and cats
- Senior Citizens Sitting Area

PREMIUM ADDITIONS (5-star projects):
- Private Spa and Wellness Center
- Rooftop Bar / Lounge
- Infinity Pool with beach vibes
- Concierge Services
- Housekeeping Services
- Valet Parking
- Private Dining Area
- Golf Simulator
- Wine Tasting Room
""",
        "metadata": {"type": "amenities", "source": "Real Estate Knowledge", "project": "General"}
    },
    {
        "content": """
PROPERTY TYPES IN REAL ESTATE:

RESIDENTIAL PROPERTY TYPES:

1. APARTMENT / FLAT:
   - Multi-story residential unit in apartment building
   - Shared infrastructure (parking, gardens, amenities)
   - Most common type for urban living
   - Sizes:
     * 1BHK (Bedroom-Hall-Kitchen): 500-700 sqft
     * 2BHK: 900-1200 sqft
     * 3BHK: 1400-1800 sqft
     * 4BHK: 1800-2500 sqft
     * 5BHK: 2500+ sqft
   - Prices depend on location, amenities, floor, and age

2. VILLA:
   - Independent standalone house with dedicated land
   - Includes courtyard, garden, and private parking
   - Typical size: 2000-5000 sqft built-up area
   - Provides maximum privacy and personalization
   - Common in gated communities or plots
   - Premium pricing due to exclusivity and space

3. PLOT / LAND:
   - Raw or semi-developed land for personal construction
   - Price per square foot varies by location
   - Buyer responsible for construction
   - Longer investment horizon (development + sale)
   - Suitable for investors and developers
   - Residential, commercial, or mixed-use plots available

4. DUPLEX:
   - Two-floor residential unit within apartment complex
   - More spacious than apartment, less than villa
   - Typically 2-3 BHK configuration
   - Private staircase and garden in some
   - Mid-range pricing between apartments and villas

5. PENTHOUSE:
   - Top floor unit with exclusive access and terrace
   - Premium finish and amenities
   - Panoramic views and open-air space
   - 20-30% premium over regular apartments
   - Limited availability, high demand

6. STUDIO / BACHELOR:
   - Single room with attached kitchen and bathroom
   - Compact living space: 300-500 sqft
   - Affordable entry-level property
   - Popular for young professionals and students
   - Minimal maintenance and utility costs

AREA MEASUREMENT CLARIFICATION:

1. CARPET AREA (USABLE AREA):
   - Actual usable living space (RERA mandated)
   - Excludes walls, common areas, balconies
   - Most important for buyers
   - Typically 400 sqft for 1BHK, 700 sqft for 2BHK

2. BUILT-UP AREA (CONSTRUCTION AREA):
   - Carpet area + internal wall thickness
   - 10-15% more than carpet area
   - Used by builders for billing

3. SUPER BUILT-UP AREA (TOTAL AREA):
   - Built-up area + share of common areas
   - Includes lobbies, hallways, lifts, staircase, gardens
   - 25-30% more than carpet area
   - What's shown in property advertisements

EXAMPLE:
A "1BHK - 600 sqft" listing:
- Carpet Area: 550-600 sqft (actual usable)
- Built-up Area: 620 sqft
- Super Built-up: 750-800 sqft
- Buyer SHOULD focus on carpet area only

PROPERTY CLASSIFICATIONS:
- Residential: Single/Multi-family homes
- Commercial: Office, retail, warehouses
- Industrial: Manufacturing, logistics
- Hospitality: Hotels, resorts
- Mixed-use: Combined residential + commercial
""",
        "metadata": {"type": "property_info", "source": "Real Estate Knowledge", "project": "General"}
    },
    {
        "content": """
SITE VISIT & APPOINTMENT SCHEDULING PROCESS:

PROCESS FLOW:
1. INITIAL INTEREST:
   - Customer expresses interest via WhatsApp, call, or website form
   - RM (Relationship Manager) collects contact details and preferences

2. APPOINTMENT SCHEDULING:
   - RM proposes available time slots
   - Confirm date, time, and meeting point
   - Send location details, parking info, and directions
   - Working hours: Weekdays 10 AM - 6 PM, Weekends 10 AM - 4 PM
   - Last slots available: 5 PM weekdays, 3:30 PM weekends (90 min visit)

3. PRE-VISIT PREPARATION (by RM):
   - Prepare site briefing (current progress, amenities, timeline)
   - Ready model flat with all lights/facilities on
   - Print brochures, floor plans, price sheets, location maps
   - Prepare financing options overview

4. SITE VISIT (90-120 minutes typical):
   - Welcome customer at gate/office
   - Walking tour of site (construction area, common facilities)
   - Visit model flat (show finishes, layout, fittings)
   - Explain project timeline and construction progress
   - Discuss location advantages (schools, transport, malls, hospitals)
   - Present amenities, payment plans, pricing
   - Answer technical questions about specifications
   - Take customer feedback and preferences note

5. POST-VISIT:
   - Hand over brochure, price list, floor plan, and finance options
   - Collect mobile number for follow-up (if not already collected)
   - Log visit details in CRM with customer feedback
   - Discuss commitment level (serious, interested, casual)

6. FOLLOW-UP (24 hours):
   - Call customer for feedback
   - Answer any questions or concerns
   - Send detailed proposal via WhatsApp/email if interested
   - Check if customer needs financing guidance
   - Offer site visit for family members if applicable
   - Discuss next steps (booking, registration, etc.)

7. NEGOTIATION & BOOKING:
   - If customer shows strong interest: Prepare customized proposal
   - Discuss pricing negotiation (if applicable)
   - Explain booking process, documentation, and payment schedule
   - Collect booking amount (typically Rs 1-5 Lakhs to block unit)
   - Execute booking agreement and collect payment

CUSTOMER JOURNEY SUMMARY:
   Interest → Schedule Visit → Site Tour → Proposal → Follow-up → Decision → Booking → Registration

KEY SUCCESS FACTORS:
- Punctual appointment scheduling and follow-up
- Professional site presentation
- Clear explanation of project, amenities, pricing
- Genuine customer engagement and addressing concerns
- Quick follow-up (within 24 hours, ideally 4-6 hours)
- Transparent communication about pricing and offers

COMMON OBJECTIONS & RESPONSES:
Q: Is this project on time?
A: Current status is [specify phase]. Timeline is [date]. RERA registered and monitored.

Q: Can you give discount?
A: Base price is fixed. Offers available during promotions. Check current schemes.

Q: Can I get finance easily?
A: Yes, tie-ups with major banks. Up to 80% LTV. We assist with documentation.

Q: What if I change my mind?
A: Booking amount refundable if cancellation within 7-15 days. Check booking agreement terms.

Q: When is possession?
A: Expected possession: [date]. RERA mandates compensation if delayed beyond 18 months.
""",
        "metadata": {"type": "process", "source": "Real Estate Knowledge", "project": "General"}
    },
    {
        "content": """
REAL ESTATE INVESTMENT GUIDE:

WHY INVEST IN REAL ESTATE?
1. Tangible Asset: Physical property you can see and touch
2. Leverage: Use 20% capital + 80% borrowed money
3. Tax Benefits: Deductions on EMI interest, depreciation (commercial), 1031 exchanges
4. Steady Appreciation: Historically 8-12% annual appreciation (India average)
5. Rental Income: Regular monthly income if rented out
6. Inflation Hedge: Property value rises with inflation

INVESTMENT STRATEGIES:

1. BUY & HOLD (Long-term):
   - Purchase property
   - Hold for 10-25 years
   - Benefit from appreciation
   - Typically 2-3x returns in 10 years
   - Steady rental income during holding period

2. FIX & FLIP (Medium-term):
   - Buy under-valued property
   - Renovate/redevelop
   - Sell in 2-5 years
   - Higher risks, higher returns (40-100% profit)
   - Requires capital for renovation

3. RENTAL INVESTMENT (Income-focused):
   - Buy property with strong rental yield
   - Target 3-5% annual rental yield
   - Steady monthly income
   - Low maintenance apartments preferred
   - Requires tenant management

4. REAL ESTATE DEVELOPMENT (Professional):
   - Buy land/old property
   - Get regulatory approvals
   - Develop into new project
   - Sell or rent units
   - High complexity, highest returns

TYPES OF INVESTMENT PROPERTIES:

Residential:
- 1-2 BHK apartments (easiest to rent)
- Villas (premium, stable value)
- Student housing (rental income focused)
- Senior citizen homes (specialized market)

Commercial:
- Office spaces (3-5 year leases)
- Retail shops (high foot traffic areas)
- Warehouses (industrial tenants)
- Co-working spaces (emerging trend)

Industrial:
- Manufacturing units
- Logistics warehouses
- Power plants
- Lowest rental yield but stable tenants

INVESTMENT METRICS:

1. Gross Rental Yield = Annual Rent / Property Price
   Example: Rs 50,000/month = Rs 6 Lakh/year on Rs 1 Cr property = 6% yield

2. Net Rental Yield = (Annual Rent - Expenses) / Property Price
   Expenses: Property tax, maintenance, insurance, vacancy (2-3%)

3. Capital Appreciation = (Sale Price - Purchase Price) / Purchase Price
   Example: Bought at Rs 50 Lakh, sold at Rs 75 Lakh = 50% appreciation

4. Cap Rate = Net Operating Income / Property Value
   Used for commercial properties (5-8% typical)

RISK FACTORS:
- Market downturns (cyclical, recovers over time)
- Tenant defaults (vacancy, non-payment)
- Regulatory changes (rent control, taxes)
- Maintenance costs (depreciation, repairs)
- Liquidity (can take 3-6 months to sell)
- Natural disasters (flood, earthquake, fire)

DUE DILIGENCE CHECKLIST:
✓ Title deed verification (clear ownership)
✓ RERA registration (if new project)
✓ Location analysis (future growth potential)
✓ Rental demand (for investment properties)
✓ Builder/Developer credibility
✓ Legal clearances (no litigation)
✓ Financial viability (ROI, payback period)
✓ Comparison with market rates
""",
        "metadata": {"type": "investment", "source": "Real Estate Knowledge", "project": "General"}
    }
]


async def seed_documents():
    """Seed ChromaDB with real estate documents."""
    try:
        setup_logging()
        logger.info("seed_rag_start", doc_count=len(REAL_ESTATE_DOCS))

        indexer = get_indexer()

        # Extract just the content for indexing
        documents = [doc["content"] for doc in REAL_ESTATE_DOCS]

        # Index documents
        result = await indexer.index_documents(
            tenant_id="dubait11",
            documents=documents,
            project_id="real-estate-ai",
            metadata={"source": "Knowledge Base Seed"}
        )

        logger.info(
            "seed_rag_complete",
            indexed=result["indexed"],
            chunks=result["chunks"],
            collection=result["collection"]
        )

        print(f"\n✅ Seeding Complete!")
        print(f"   Documents Indexed: {result['indexed']}")
        print(f"   Total Chunks: {result['chunks']}")
        print(f"   Collection: {result['collection']}")
        print(f"\nRAG system is now ready to answer questions about:")
        print("   • Payment Plans and Financing")
        print("   • RERA Regulations")
        print("   • Property Types and Specifications")
        print("   • Amenities")
        print("   • Site Visit Process")
        print("   • Real Estate Investment")

        return True

    except Exception as e:
        logger.error("seed_rag_failed", error=str(e), exc_info=True)
        print(f"\n❌ Seeding Failed: {str(e)}")
        return False


if __name__ == "__main__":
    success = asyncio.run(seed_documents())
    sys.exit(0 if success else 1)
