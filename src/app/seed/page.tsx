"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addLead, addContact, addActivity, addTask } from "@/lib/firestore";
import { useAuth } from "@/lib/hooks/use-auth";
import { format, addDays } from "date-fns";

const SAMPLE_CONTACTS = [
  { name: "Sipho Ndlovu", email: "sipho@techstart.co.za", phone: "+27 82 345 6789", company: "TechStart SA", title: "CEO", notes: "Key decision maker. Met at Cape Town Tech Summit." },
  { name: "Thandi Moyo", email: "thandi@capeinvest.co.za", phone: "+27 84 567 8901", company: "Cape Invest Group", title: "Head of Sales", notes: "Very responsive. Prefers WhatsApp communication." },
  { name: "Nomsa Dlamini", email: "nomsa@retailking.co.za", phone: "+27 72 890 1234", company: "RetailKing", title: "VP Sales Operations", notes: "Budget holder. Manages 12 sales reps across Gauteng." },
  { name: "Blessing Nkosi", email: "blessing@payfast.co.za", phone: "+27 72 456 7890", company: "PayFast Solutions", title: "CTO", notes: "Champion customer. Great for case studies." },
  { name: "Zanele Khumalo", email: "zanele@edupathways.co.za", phone: "+27 83 234 5678", company: "EduPathways", title: "Director of Admissions", notes: "University sector. Procurement process is 6 weeks." },
  { name: "Ryan October", email: "ryan@mediamasters.co.za", phone: "+27 84 123 4567", company: "Media Masters", title: "Managing Director", notes: "Creative agency. 15 staff. Loves modern UI." },
  { name: "Lisa van Wyk", email: "lisa@travelcape.co.za", phone: "+27 83 567 8901", company: "TravelCape", title: "Operations Manager", notes: "Happy customer. Annual subscriber." },
  { name: "Fatima Al-Rashid", email: "fatima@dubaiventures.ae", phone: "+971 50 123 4567", company: "Dubai Ventures", title: "Regional Director", notes: "Multi-country rollout. High value account." },
];

const SAMPLE_LEADS = [
  { name: "Sipho Ndlovu", email: "sipho@techstart.co.za", phone: "+27 82 345 6789", company: "TechStart SA", status: "new" as const, source: "Website", notes: "Interested in enterprise plan. Found us via Google.", value: 45000 },
  { name: "Emma van der Merwe", email: "emma@greenfield.io", phone: "+27 83 456 7890", company: "Greenfield Innovations", status: "new" as const, source: "LinkedIn", notes: "Reached out after seeing our post about CRM automation.", value: 28000 },
  { name: "James Okonkwo", email: "james@lagostech.ng", phone: "+234 803 456 7890", company: "Lagos Tech Hub", status: "new" as const, source: "Referral", notes: "Referred by Thandi Moyo. Needs multi-user CRM.", value: 62000 },
  { name: "Lerato Molefe", email: "lerato@bluewavedesign.co.za", phone: "+27 71 234 5678", company: "BlueWave Design", status: "new" as const, source: "Website", notes: "Small agency, 5 people. Looking for simple lead tracking.", value: 15000 },
  { name: "Chen Wei", email: "chen@pacificbridge.com", phone: "+86 138 0000 1234", company: "Pacific Bridge Exports", status: "new" as const, source: "Trade Show", notes: "Met at Africa Trade Expo. Wants to manage SA distributors.", value: 120000 },
  { name: "Thandi Moyo", email: "thandi@capeinvest.co.za", phone: "+27 84 567 8901", company: "Cape Invest Group", status: "contacted" as const, source: "Referral", notes: "Had intro call. Very interested in pipeline management.", value: 85000 },
  { name: "David Botha", email: "david@solarpowered.co.za", phone: "+27 82 678 9012", company: "SolarPowered SA", status: "contacted" as const, source: "LinkedIn", notes: "Sent demo video. He shared with his team.", value: 55000 },
  { name: "Amina Hassan", email: "amina@nairobisolutions.ke", phone: "+254 722 345 678", company: "Nairobi Solutions", status: "contacted" as const, source: "Website", notes: "Emailed pricing sheet. Interested in annual plan.", value: 38000 },
  { name: "Pieter Viljoen", email: "pieter@farmtech.co.za", phone: "+27 83 789 0123", company: "FarmTech Solutions", status: "contacted" as const, source: "Cold Call", notes: "Manages 200+ farming clients. Needs bulk import feature.", value: 95000 },
  { name: "Nomsa Dlamini", email: "nomsa@retailking.co.za", phone: "+27 72 890 1234", company: "RetailKing", status: "qualified" as const, source: "Referral", notes: "Budget approved. Needs CRM for 12 sales reps.", value: 180000 },
  { name: "Michael Steyn", email: "michael@constructpro.co.za", phone: "+27 82 901 2345", company: "ConstructPro", status: "qualified" as const, source: "Website", notes: "Completed demo. Loves the simplicity.", value: 72000 },
  { name: "Fatima Al-Rashid", email: "fatima@dubaiventures.ae", phone: "+971 50 123 4567", company: "Dubai Ventures", status: "qualified" as const, source: "Trade Show", notes: "Wants to roll out across 3 countries.", value: 250000 },
  { name: "Sarah Mthembu", email: "sarah@healthfirst.co.za", phone: "+27 71 012 3456", company: "HealthFirst Clinics", status: "qualified" as const, source: "LinkedIn", notes: "4 clinic locations. Wants patient lead tracking.", value: 65000 },
  { name: "Ryan October", email: "ryan@mediamasters.co.za", phone: "+27 84 123 4567", company: "Media Masters", status: "proposal" as const, source: "Website", notes: "Sent formal proposal R95k/year. Negotiating.", value: 95000 },
  { name: "Zanele Khumalo", email: "zanele@edupathways.co.za", phone: "+27 83 234 5678", company: "EduPathways", status: "proposal" as const, source: "Referral", notes: "University lead management. Proposal for 500 student pipeline.", value: 145000 },
  { name: "André du Plessis", email: "andre@vineyardgroup.co.za", phone: "+27 82 345 6789", company: "Vineyard Group", status: "proposal" as const, source: "Cold Call", notes: "Wine estate portfolio. Tourism + wholesale separation.", value: 78000 },
  { name: "Blessing Nkosi", email: "blessing@payfast.co.za", phone: "+27 72 456 7890", company: "PayFast Solutions", status: "won" as const, source: "LinkedIn", notes: "Signed! 2-year contract. Champion deal!", value: 220000 },
  { name: "Lisa van Wyk", email: "lisa@travelcape.co.za", phone: "+27 83 567 8901", company: "TravelCape", status: "won" as const, source: "Referral", notes: "Closed after 3-week negotiation. Annual plan.", value: 48000 },
  { name: "Oluwaseun Adeyemi", email: "seun@fintech360.ng", phone: "+234 805 678 9012", company: "FinTech360", status: "won" as const, source: "Trade Show", notes: "Lagos fintech company. Signed enterprise deal.", value: 310000 },
  { name: "Karen Pretorius", email: "karen@beautybox.co.za", phone: "+27 71 678 9012", company: "BeautyBox SA", status: "won" as const, source: "Website", notes: "Quick close - 2 weeks from first contact.", value: 35000 },
  { name: "Mohammed Patel", email: "mohammed@spiceworld.co.za", phone: "+27 84 789 0123", company: "Spice World Trading", status: "won" as const, source: "Referral", notes: "Import/export CRM. Smooth deal.", value: 68000 },
  { name: "Jan de Klerk", email: "jan@oldmutualbroker.co.za", phone: "+27 82 890 1234", company: "Independent Broker", status: "lost" as const, source: "Cold Call", notes: "Went with Salesforce. Needed enterprise features.", value: 150000 },
  { name: "Grace Osei", email: "grace@accradigital.gh", phone: "+233 24 901 2345", company: "Accra Digital Agency", status: "lost" as const, source: "Website", notes: "Chose HubSpot free tier. Price sensitive.", value: 22000 },
  { name: "Rudi Swanepoel", email: "rudi@steelworks.co.za", phone: "+27 83 012 3456", company: "SA Steelworks", status: "lost" as const, source: "Trade Show", notes: "Internal politics killed the deal.", value: 185000 },
];

const SAMPLE_ACTIVITIES = [
  { type: "call" as const, subject: "Intro call with Thandi", description: "Discussed pipeline management needs. Very enthusiastic. Wants demo next week." },
  { type: "email" as const, subject: "Pricing sent to Amina", description: "Sent annual pricing breakdown. She'll discuss with finance team." },
  { type: "meeting" as const, subject: "Demo with Nomsa's team", description: "Full demo for 6 people. They loved the dashboards and reporting." },
  { type: "note" as const, subject: "Competitor intel - RetailKing", description: "Nomsa mentioned they also demoed Zoho but found it too complex." },
  { type: "call" as const, subject: "Follow-up with Ryan October", description: "Discussed 10% discount request. Will send revised proposal." },
  { type: "email" as const, subject: "Contract sent to Blessing", description: "2-year enterprise contract sent. Awaiting legal review." },
  { type: "meeting" as const, subject: "Onboarding kickoff - PayFast", description: "Started onboarding. Training scheduled for next week." },
  { type: "call" as const, subject: "Qualification call with Fatima", description: "Confirmed budget and timeline. Multi-country rollout starting Q2." },
  { type: "email" as const, subject: "Proposal follow-up - EduPathways", description: "Zanele confirmed the procurement process is underway." },
  { type: "note" as const, subject: "Lost deal analysis - Jan", description: "Key learning: need to build enterprise SSO feature to compete with Salesforce." },
  { type: "meeting" as const, subject: "Strategy session - Vineyard Group", description: "André wants wine tourism and wholesale tracking separated." },
  { type: "call" as const, subject: "Check-in with Lisa", description: "Happy customer! Offered to be a reference. May upgrade next year." },
];

const SAMPLE_TASKS = [
  { title: "Send proposal to Ryan October", description: "Include 10% discount per discussion", dueDate: format(addDays(new Date(), 2), "yyyy-MM-dd"), priority: "high" as const, status: "pending" as const },
  { title: "Follow up with Amina Hassan", description: "Check if finance approved the budget", dueDate: format(addDays(new Date(), 3), "yyyy-MM-dd"), priority: "medium" as const, status: "pending" as const },
  { title: "Prepare demo for Michael Steyn", description: "Focus on construction industry workflows", dueDate: format(addDays(new Date(), 1), "yyyy-MM-dd"), priority: "high" as const, status: "pending" as const },
  { title: "Send case study to Fatima", description: "Multi-country deployment case study", dueDate: format(addDays(new Date(), 5), "yyyy-MM-dd"), priority: "medium" as const, status: "pending" as const },
  { title: "Schedule training - PayFast", description: "Onboarding training for 8 users", dueDate: format(addDays(new Date(), 7), "yyyy-MM-dd"), priority: "medium" as const, status: "pending" as const },
  { title: "Review EduPathways contract", description: "Legal review before final sign-off", dueDate: format(addDays(new Date(), -1), "yyyy-MM-dd"), priority: "high" as const, status: "pending" as const },
  { title: "Update Vineyard Group proposal", description: "Add tourism vs wholesale split feature", dueDate: format(addDays(new Date(), 4), "yyyy-MM-dd"), priority: "low" as const, status: "pending" as const },
  { title: "Quarterly check-in with Lisa", description: "Discuss upgrade options and referral program", dueDate: format(addDays(new Date(), 14), "yyyy-MM-dd"), priority: "low" as const, status: "pending" as const },
  { title: "Send welcome pack to Blessing", description: "Champion customer welcome pack shipped", dueDate: format(addDays(new Date(), -3), "yyyy-MM-dd"), priority: "medium" as const, status: "completed" as const },
  { title: "Create competitor comparison doc", description: "Compare features with Salesforce and HubSpot", dueDate: format(addDays(new Date(), -5), "yyyy-MM-dd"), priority: "high" as const, status: "completed" as const },
];

export default function SeedPage() {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState("");

  const totalItems = SAMPLE_CONTACTS.length + SAMPLE_LEADS.length + SAMPLE_ACTIVITIES.length + SAMPLE_TASKS.length;

  const handleSeed = async () => {
    if (!user) return;
    setSeeding(true);
    let count = 0;

    // Seed contacts first
    setProgress("Creating contacts...");
    const contactIds: string[] = [];
    for (const contact of SAMPLE_CONTACTS) {
      const id = await addContact({ ...contact, ownerId: user.uid });
      contactIds.push(id);
      count++;
      setProgress(`Creating contacts... ${count}/${totalItems}`);
    }

    // Seed leads (link some to contacts)
    setProgress("Creating leads...");
    const leadIds: string[] = [];
    for (let i = 0; i < SAMPLE_LEADS.length; i++) {
      const lead = SAMPLE_LEADS[i];
      // Link leads to contacts where names match
      const matchingContact = SAMPLE_CONTACTS.findIndex((c) => c.name === lead.name);
      const contactId = matchingContact >= 0 ? contactIds[matchingContact] : "";
      const id = await addLead({ ...lead, contactId, ownerId: user.uid });
      leadIds.push(id);
      count++;
      setProgress(`Creating leads... ${count}/${totalItems}`);
    }

    // Seed activities (spread across leads)
    setProgress("Creating activities...");
    for (let i = 0; i < SAMPLE_ACTIVITIES.length; i++) {
      const act = SAMPLE_ACTIVITIES[i];
      const leadId = leadIds[i % leadIds.length] || "";
      await addActivity({ ...act, leadId, contactId: "", ownerId: user.uid });
      count++;
      setProgress(`Creating activities... ${count}/${totalItems}`);
    }

    // Seed tasks (spread across leads)
    setProgress("Creating tasks...");
    for (let i = 0; i < SAMPLE_TASKS.length; i++) {
      const task = SAMPLE_TASKS[i];
      const leadId = leadIds[i % leadIds.length] || "";
      await addTask({ ...task, leadId, contactId: "", ownerId: user.uid });
      count++;
      setProgress(`Creating tasks... ${count}/${totalItems}`);
    }

    setSeeding(false);
    setDone(true);
  };

  return (
    <AppShell>
      <div className="max-w-lg mx-auto mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Seed Sample Data</CardTitle>
            <CardDescription>
              Populate your CRM with {SAMPLE_CONTACTS.length} contacts, {SAMPLE_LEADS.length} leads,
              {" "}{SAMPLE_ACTIVITIES.length} activities, and {SAMPLE_TASKS.length} tasks for testing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {done ? (
              <div className="text-center py-4">
                <p className="text-green-600 font-semibold text-lg">{totalItems} items created successfully!</p>
                <p className="text-sm text-muted-foreground mt-2">Go to the Dashboard to see everything in action.</p>
              </div>
            ) : (
              <>
                {seeding && (
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-sm text-muted-foreground">{progress}</span>
                  </div>
                )}
                <Button onClick={handleSeed} disabled={seeding} className="w-full">
                  {seeding ? "Seeding..." : "Seed All Sample Data"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
