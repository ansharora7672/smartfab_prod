Smartfab Lathe System Overview
The system is a web-based order and workflow management platform for a Dubai-based manufacturing outsourcing company called Smartfab Lathe.
The company does not manufacture products directly. Instead, it operates as a manufacturing intermediary, receiving customer requests for manufacturing services and coordinating with a network of external vendors who perform the work.
The platform manages the complete lifecycle of an order:
Customer Inquiry → Consultation → Quote Creation → Client Approval → Vendor Coordination → Production Tracking → Delivery.
The platform includes:
A public-facing website for customer inquiries and order tracking.
An internal operational dashboard for company staff and administrators.

The system aims to centralize all operational processes in one platform so that inquiries, quotes, orders, vendor coordination, and deliveries are managed efficiently.

Primary Objectives of the System
The system is designed to accomplish the following operational goals:
Capture customer inquiries through an online form.
Allow customers to schedule consultation calls with the company.
Manage internal workflows for handling incoming inquiries.
Generate professional quotes for manufacturing services.
Coordinate work with external vendors.
Convert approved quotes into confirmed orders.
Track the production progress of each item in an order.
Manage deliveries and generate delivery documentation.
Allow customers to track the progress of their orders online.

Core Business Model
Smartfab Lathe operates as a manufacturing coordination and outsourcing service.
The company receives requests from customers who need machining or fabrication services. After discussing the requirements with the customer, the company prepares a quote and then outsources the work to specialized vendors.
Typical operational flow:
Customer submits a quote request.
A consultation call is scheduled with company staff.
Staff discuss the customer’s requirements.
Staff prepare a quote listing services and items.
The quote is sent to the customer.
The customer approves the quote.
The customer issues a Local Purchase Order (LPO) confirming the order.
The company assigns work to appropriate vendors.
Vendors manufacture the items or perform the services.
The company tracks production progress.
Completed items are delivered to the customer.
Delivery documentation is generated.
Services Offered by the Company
These services should be displayed on the landing page. The landing page should have amazing visuals and it should be really elegant, premium, and attractive.:
CNC Milling
CNC Turning
Laser Cutting
EDM Wire Cutting
EDM Sparking
MIG Welding
TIG Welding
Arc Welding
Gear Cutting
Bending
Tool and Part Manufacturing
High Production Manufacturing

User Roles in the System
The system supports two main internal user roles.
Admin
Admins have full system access.
Responsibilities include:
Viewing all tickets and orders.
Managing staff accounts.
Adding or removing administrators.
Managing vendors.
Managing delivery drivers.
Assigning or reassigning tickets.
Monitoring overall operational progress.

Admins have visibility into all activities within the organization
Staff
Staff users are responsible for operational tasks.
Responsibilities include:
Handling customer inquiries.
Conducting consultation calls.
Generating quotes.
Communicating with vendors.
Managing production progress.
Creating delivery notes.

Staff can also claim tickets from the pending queue.

Ticket Visibility Model
The system uses a shared visibility model for tickets.
All staff members can see all tickets in the system, regardless of assignment.
However, tickets may still be assigned to a specific staff member who is responsible for handling that ticket.
Key principles:
All staff can view all tickets.
Staff can claim unassigned tickets.
Staff can see which staff member currently owns a ticket.
Staff primarily manage their own assigned tickets.

This design allows flexibility if staff need to help each other or take over work.
Public Website
The platform includes a public-facing website used for lead generation.
The landing page presents information about the company and its services.
Two primary actions are available at the top of the page:
Get a Quote
Track Your Order

Quote Request Process
When a customer clicks Get a Quote, they are directed to a form where they submit their inquiry.
The form collects:
Full Name
Company Name
Company Address
Email Address
Phone Number (must start with +971)
After submitting the form, the user proceeds to the appointment scheduling stage.
Consultation Call Scheduling
The consultation system uses a shared company availability calendar, not individual staff / admin calendars.
Customers do not choose a staff/admin member.
Instead, they choose a time slot for the company consultation window.
Shared Availability Calendar
The calendar displays 30-minute time slots representing company availability. (Ideal I think it should show up for the working week and the next week not more than that.)
Important characteristics:
The calendar does not display staff names.

Availability represents company consultation capacity.

Multiple customers can book the same slot depending on operational capacity.

Ticket Creation After Booking
When a customer selects a time slot:
The system automatically creates a ticket.
Ticket information includes:
Ticket ID (the format for ticket id should be SFL-YYYYMMDD-XXXX)
Time when the Ticket is created
Customer name
Company name
Email
Phone number
Scheduled consultation time and date
Ticket status = Pending
Assigned staff = None
Initially, the ticket is unassigned.
TicketStatusEnum would have - PENDING, CLAIMED, CALL_COMPLETED, IN_QUOTE_PREPARATION, CLOSED
Notification to Team
After the ticket is created:
All admins and staff receive an email notification.
The notification informs them that a new consultation has been scheduled.

The ticket also appears in the Pending Tickets dashboard.
Pending Tickets Stage
The Pending stage contains consultation calls waiting to be handled.
(in here there should be an option of sort by assigned and by staff/admin - drop down) by default unassigned ones come at the top)
Displayed information:
Ticket ID
Customer name
Company
Contact information (Email and Phone Number)
Consultation time and date
Assigned staff
TicketStatus

Claiming a Ticket
Staff or admins can click Claim Ticket.
When claimed:
The system assigns the ticket to that user.
Everyone can see who claimed the ticket.
This ensures the team knows who will take the consultation call.

Multiple Bookings per Slot
The system allows multiple consultations during the same time slot.
Example:
10:00–10:30 slot:
Ticket A → Customer 1
Ticket B → Customer 2
Ticket C → Customer 3
Different staff members can claim these tickets.
Calendar Availability Logic
If no one books a slot, it remains available.
If one customer books the slot, the slot still appears available.
The slot only disappears if the system reaches the maximum booking capacity for that slot.
(So basically every staff and admin will select the availability for this and the next week) and based on that this whole logic will work.
This allows multiple consultations to occur simultaneously.
Completing the Consultation Call
After the consultation call is finished, staff click: Mark Call Completed
This moves the ticket to the next stage.
Transition Stage (Quote Preparation)
The Transition stage contains tickets where:
The consultation call has been completed
A quote needs to be created
The interface displays a table view of tickets.

Columns include:
Ticket ID and the time when the ticket was created
Customer Details (Company Name, Full Name, Email)
Quote Sent (Yes or No)
Quote Approved (Yes or No)
Actions - Generate Quote

Quote Generation
Staff/admin click Generate Quote.
The system displays a quote form where staff/admin enter items.
Each quote can contain multiple items.
This is a form where there are two types of fields global and per item
Will share info about this in quote pdf generation
Vendor Consultation
Before finalizing a quote, staff may contact vendors to confirm:
Pricing
Production capability
Delivery time
Each quote item may correspond to a vendor. The admin and staff will contact those vendors and assign each item a vendor.

Quote PDF Generation
The system generates a professional quote PDF using the company template.
The PDF includes:
Invoice No. [This will be the ticket number and this will be filled by the system]
Dated [when they click generate invoice this should be filed by the system]
Delivery Note [this has to be asked from the admin/staff via a form]
Mode/Terms of Payment [this has to be asked from the admin/staff via a form]
Supplier’s Ref. [this has to be asked from the admin/staff via a form]
Other Reference(s) [this has to be asked from the admin/staff via a form]
Delivery Note Date [this has to be asked from the admin/staff via a form]
Despatched through [this has to be asked from the admin/staff via a form]
Destination [this has to be asked from the admin/staff via a form]
Terms of Delivery [this has to be asked from the admin/staff via a form]
Buyer [system will fill this field because we know which ticketid they are referring and the system has the details]
Then field for each item -
Sr No [this has to be asked from the admin/staff via a form]
Description of Service [this has to be asked from the admin/staff via a form]
Quantity [this has to be asked from the admin/staff via a form]
Rate [this has to be asked from the admin/staff via a form]
Rate(Incl.VAT) [this has to be asked from the admin/staff via a form]
Per [this has to be asked from the admin/staff via a form]
Disc. Amount(AED) [this has to be asked from the admin/staff via a form]
VAT% [this has to be asked from the admin/staff via a form]
Amount [this has to be asked from the admin/staff via a form]
Total Incl. VAT(AED) [this has to be asked from the admin/staff via a form]
Then at the pdf end the template have -
Amount Chargeable (in words) [this has to be asked from the admin/staff via a form]
Taxable Value [this has to be asked from the admin/staff via a form]
Value Added Tax [this has to be asked from the admin/staff via a form]
Invoice Total [this has to be asked from the admin/staff via a form]

Staff/admin can:
Preview the PDF
Download the PDF
One-Click Email the PDF to the client. There will be a template for this email.
Quote Sent Status
Once the quote is sent:
The system records: Quote Sent = Yes
Staff can resend the quote if necessary.

Client Response
Clients may:
Approve quote
Reject quote
Request Modification
No Reply
On the email there should be options for the client to select and in the transition all of that should be shown. Maybe sub tabs in transition idk. If they reject us, we send them a form and a message in email so that we know what went wrong. If they say request modification we’ll say we will be in touch with you shortly like someone will call. It’s all email service.

Quote Approval and LPO
When the client approves the quote, and email service triggers which ask them to send a Local Purchase Order confirming the order.
The system records:
LPO number
Approval date
Quote reference
Once recorded, the client becomes Onboarded and ticket moves to the next stage that is active.
Active Orders Stage
The approved quote becomes an active order.
Order details include:
Order ID (which is the TicketID)

Customer information

LPO number

Order value

Order date
Order Items
Each order contains multiple items.
Each item includes:
Description

Quantity

Assigned vendor

Production status (this will be updated manually by admin/staff)
Production Status Tracking
Items progress through stages:
Order Received
Vendor Assigned
In Production
Quality Check
Ready for Delivery
Delivered
Completed
Vendor Management
Admins maintain vendor records including:
Vendor name
Company name
Phone number
Email
Services offered
Delivery Management
When items are ready, staff/admin create Delivery Notes.
Suppose something is Ready for Delivery inside an order then the admin./styaf will assign driver from the list of drivers, and the admin staff will fill the delivery note for that specific item

It is similar to quote generation it is a pdf and it has

Company: our system knows the system will populate it
Address: our system knows the system will populate it
Phone No: our system knows the system will populate it
Order No: our system knows the system will populate it
Date: our system knows the system will populate it with the date today
LPO no. our system knows the system will populate it

And it will allow us to select all the items that are ready for delivery or what the admin/.staff wna so to deliver in that order

And they will review it and send it via email. The version and different delivery notes until the entire order is complete should be easily accessible and viable with one click.
Delivery Drivers
Admins manage drivers including:
Name
Phone number
Vehicle details

Drivers are assigned when scheduling deliveries.
Customer Order Tracking
Customers can track orders via Track Your Order.
They enter:
Order number
or
LPO number

Displayed information:
Order summary

Item list

Production status

Delivery status

For eahc ofd the item and the entier order.

Full flow -
Customer inquiry
→ consultation scheduled
→ ticket created
→ staff claims ticket
→ consultation completed
→ quote prepared
→ vendor consultation
→ quote sent
→ quote approved
→ LPO received
→ order created
→ vendors assigned
→ production tracked
→ deliveries scheduled
→ delivery notes generated
→ order completed

## STRICT DESIGN & "ANTI-AI" PREMIUM OVERRIDES

Do not use generic, default AI layouts. The UI must look like a high-end, custom-coded agency website.

1. Typography: Use 'Plus Jakarta Sans' for all headings (with `tracking-tight` for large text) and 'Inter' for body copy.
2. Whitespace: Implement macro-whitespace. Use extensive padding (`py-24` minimum between sections).
3. Shadows & Borders: NO harsh default drop-shadows. Cards must use ultra-soft, diffused shadows (e.g., `rgba(0,0,0,0.03)` with a large blur radius) and ultra-thin `1px` borders matching the silver from the Smartfab logo.
4. Animation: All interactive elements (buttons, service cards) must use `duration-500 ease-out` transitions.
5. Aesthetic: The overall feel should be "Cinematic Industrial"—deep navy blues, stark whites, metallic silver accents, and clean, asymmetrical grid layouts.
