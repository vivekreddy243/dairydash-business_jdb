# DairyDash - Setup & Usage Guide

## Project Overview

DairyDash is a professional milk delivery management system built with React, TypeScript, Tailwind CSS, and Supabase. The application provides a complete admin dashboard and customer portal for managing apartments, customers, deliveries, billing, and reports.

## Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend/Database:** Supabase (PostgreSQL)
- **Authentication:** Custom localStorage-based auth
- **Icons:** Lucide React
- **UI Components:** Custom built-in components

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**

   The `.env` file is already configured with Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://igtggmdcgtmrskqeaxxh.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Running the Application

**Development Mode:**
```bash
npm run dev
```

The app will start on `http://localhost:5173`

**Production Build:**
```bash
npm run build
```

**Type Checking:**
```bash
npm run typecheck
```

## Authentication

### Demo Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`
- Access: Full admin panel with all features

**Customer Account:**
- Phone: Any registered customer phone number from database (e.g., `9876543210`)
- Password: `1234`
- Access: Limited to "My Deliveries" and "My Billing"

### Pre-seeded Demo Customers

The database includes 6 demo customers across 3 apartments:

| Name | Phone | Apartment | Block | Flat |
|------|-------|-----------|-------|------|
| Raj Kumar | 9876543210 | Sunrise Apartments | A | 101 |
| Priya Sharma | 9876543211 | Sunrise Apartments | A | 201 |
| Amit Patel | 9876543212 | Green Valley Complex | B | 102 |
| Neha Verma | 9876543213 | Green Valley Complex | B | 301 |
| Vikram Singh | 9876543214 | Metro Heights | C | 501 |
| Anjali Gupta | 9876543215 | Metro Heights | C | 601 |

## Features

### Admin Dashboard

#### 📊 Dashboard
- Summary cards showing:
  - Total apartments
  - Total customers
  - Today's deliveries
  - Monthly revenue
- Real-time data from database

#### 🏢 Apartments Management
- **View:** List all apartments with status
- **Add:** Create new apartment complex
- **Edit:** Modify apartment details
- **Delete:** Soft delete apartments
- **Search:** Filter by name or address

#### 👥 Customers Management
- **View:** List all customers with details
- **Add:** Add new customer with subscription
- **Edit:** Update customer information
- **Pause/Activate:** Change customer status
- **Filter:** By apartment, block, or name
- **Search:** Find customers by name or phone

#### 🚚 Deliveries Management
- **Date Picker:** Select delivery date
- **Record Deliveries:**
  - Edit quantity per customer
  - Toggle status (Delivered/Skipped)
  - Save individual or all deliveries
- **Filters:** By apartment, block, or date
- **Bulk Actions:**
  - Mark all as delivered
  - Save all changes at once
- **Smart Upsert:** Creates or updates delivery records

#### 💰 Billing
- **Customer Billing:**
  - Select customer, month, year
  - View billing summary:
    - Total liters delivered
    - Delivered/skipped days
    - Price per liter
    - Total amount due
  - Daily breakdown table
- **Apartment Billing:** (Coming soon)

#### 📈 Reports
- Monthly revenue overview
- Top 5 customers by volume
- Export data as CSV

#### ⚙️ Settings
- Company details
- Default milk price
- Tax rate configuration

### Customer Portal

#### 🚚 My Deliveries
- View personal delivery history
- Filter by date
- See quantity and status

#### 💰 My Billing
- View billing for selected month/year
- See detailed breakdown
- Calculate total amount due

### Support Features

- **Contact Support Modal:** Phone, email, business hours
- **WhatsApp Integration:** Direct link to WhatsApp support
- **Floating WhatsApp Button:** Quick access from any page
- **Call Button:** Direct tel: link for phone support

## Database Schema

### Tables

**apartments**
- id (UUID, PK)
- name (text, unique)
- number_of_blocks (integer)
- address (text)
- status (active/inactive)
- created_at (timestamp)

**customers**
- id (UUID, PK)
- name (text)
- phone (text, unique)
- apartment_id (UUID, FK)
- block, floor, flat_no (text)
- address (text)
- status (active/paused)
- created_at (timestamp)

**subscriptions**
- id (UUID, PK)
- customer_id (UUID, unique FK)
- milk_type (text)
- default_qty (integer)
- price_per_liter (decimal)
- is_active (boolean)
- created_at (timestamp)

**deliveries**
- id (UUID, PK)
- customer_id (UUID, FK)
- delivery_date (date)
- quantity (integer)
- status (delivered/skipped/pending)
- created_at (timestamp)
- Unique constraint: (customer_id, delivery_date)

**settings**
- id (UUID, PK)
- company_name (text)
- default_milk_price (decimal)
- tax_rate (decimal)
- created_at (timestamp)

## File Structure

```
src/
├── components/           # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Header.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── Sidebar.tsx
│   ├── Table.tsx
│   ├── ContactModal.tsx
│   └── FloatingWhatsAppButton.tsx
├── context/             # Auth context
│   └── AuthContext.tsx
├── lib/                 # Utilities
│   └── supabase.ts      # Supabase client
├── pages/               # Page components
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Apartments.tsx
│   ├── Customers.tsx
│   ├── Deliveries.tsx
│   ├── Billing.tsx
│   ├── Reports.tsx
│   └── Settings.tsx
├── types/              # TypeScript types
│   └── index.ts
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Tailwind styles
```

## Key Features Implementation

### Authentication Flow
1. User enters credentials on login page
2. `useAuth` hook validates against demo creds or database
3. User session stored in localStorage
4. App component checks auth status and conditionally renders Login or Dashboard
5. Logout clears session and returns to login

### Data Persistence
- All data persists in Supabase PostgreSQL database
- Data survives page refresh and server restarts
- Row Level Security (RLS) enabled on all tables
- Authenticated users can access all data

### Real-time Updates
- Dashboard statistics update from live database
- Lists auto-refresh after create/update/delete actions
- Proper error handling with user feedback

### Responsive Design
- Mobile-first approach
- Sidebar collapses on small screens
- Tables scroll horizontally on mobile
- Touch-friendly buttons and spacing

## Testing Checklist

### Admin Workflows
- [ ] Login with admin/admin123
- [ ] View dashboard with real statistics
- [ ] Add new apartment
- [ ] Add new customer with subscription
- [ ] Record deliveries for today
- [ ] View customer billing for current month
- [ ] Check monthly revenue in reports
- [ ] Update settings
- [ ] Contact support via modal
- [ ] Open WhatsApp support link
- [ ] Click floating WhatsApp button
- [ ] Logout and return to login

### Customer Workflows
- [ ] Login with customer phone (9876543210) and password (1234)
- [ ] View "My Deliveries"
- [ ] View "My Billing" for current month
- [ ] Access support contacts
- [ ] Logout

### Data Integrity
- [ ] Data persists after page refresh
- [ ] Delivery records don't duplicate when saving
- [ ] Billing calculations are accurate
- [ ] Deleted items don't reappear

## Support Contact Information

**Phone:** +91 9921491249
**Email:** support@dairydash.com
**WhatsApp:** https://wa.me/919921491249
**Business Hours:** 6 AM - 10 PM IST

## Production Deployment

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy `dist` folder to hosting (Vercel, Netlify, etc.)**

3. **Ensure environment variables are set in production:**
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY

4. **Database is hosted on Supabase** - no additional backend needed

## Troubleshooting

**Login not working?**
- Ensure you're using correct credentials (admin/admin123 for admin)
- For customers, use registered phone number and password 1234
- Check browser console for errors

**Data not showing?**
- Verify Supabase connection in browser Network tab
- Check that RLS policies allow your user access
- Try refreshing page

**WhatsApp link not working?**
- Ensure you have WhatsApp installed or web.whatsapp.com access
- Check that link opens in new tab

## Future Enhancements

- [ ] Email notifications for missed deliveries
- [ ] SMS/WhatsApp alerts
- [ ] Payment integration
- [ ] Advanced reporting with charts
- [ ] Delivery route optimization
- [ ] Mobile app for drivers
- [ ] Customer review/rating system
- [ ] Subscription management UI

## License

Private - DairyDash Inc.

## Support

For technical support, contact:
- Phone: +91 9921491249
- WhatsApp: wa.me/919921491249
- Email: support@dairydash.com
