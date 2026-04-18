"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addLead } from "@/lib/firestore";
import { useAuth } from "@/lib/hooks/use-auth";

const SAMPLE_LEADS = [
  // NEW leads
  { name: "Sipho Ndlovu", email: "sipho@techstart.co.za", phone: "+27 82 345 6789", company: "TechStart SA", status: "new" as const, source: "Website", notes: "Interested in enterprise plan. Found us via Google.", value: 45000 },
  { name: "Emma van der Merwe", email: "emma@greenfield.io", phone: "+27 83 456 7890", company: "Greenfield Innovations", status: "new" as const, source: "LinkedIn", notes: "Reached out after seeing our post about CRM automation.", value: 28000 },
  { name: "James Okonkwo", email: "james@lagostech.ng", phone: "+234 803 456 7890", company: "Lagos Tech Hub", status: "new" as const, source: "Referral", notes: "Referred by Thandi Moyo. Needs multi-user CRM.", value: 62000 },
  { name: "Lerato Molefe", email: "lerato@bluewavedesign.co.za", phone: "+27 71 234 5678", company: "BlueWave Design", status: "new" as const, source: "Website", notes: "Small agency, 5 people. Looking for simple lead tracking.", value: 15000 },
  { name: "Chen Wei", email: "chen@pacificbridge.com", phone: "+86 138 0000 1234", company: "Pacific Bridge Exports", status: "new" as const, source: "Trade Show", notes: "Met at Africa Trade Expo. Wants to manage SA distributors.", value: 120000 },

  // CONTACTED leads
  { name: "Thandi Moyo", email: "thandi@capeinvest.co.za", phone: "+27 84 567 8901", company: "Cape Invest Group", status: "contacted" as const, source: "Referral", notes: "Had intro call. Very interested in pipeline management. Follow up next week.", value: 85000 },
  { name: "David Botha", email: "david@solarpowered.co.za", phone: "+27 82 678 9012", company: "SolarPowered SA", status: "contacted" as const, source: "LinkedIn", notes: "Sent demo video. He shared with his team. Waiting for feedback.", value: 55000 },
  { name: "Amina Hassan", email: "amina@nairobisolutions.ke", phone: "+254 722 345 678", company: "Nairobi Solutions", status: "contacted" as const, source: "Website", notes: "Emailed pricing sheet. Interested in annual plan.", value: 38000 },
  { name: "Pieter Viljoen", email: "pieter@farmtech.co.za", phone: "+27 83 789 0123", company: "FarmTech Solutions", status: "contacted" as const, source: "Cold Call", notes: "Manages 200+ farming clients. Needs bulk import feature.", value: 95000 },

  // QUALIFIED leads
  { name: "Nomsa Dlamini", email: "nomsa@retailking.co.za", phone: "+27 72 890 1234", company: "RetailKing", status: "qualified" as const, source: "Referral", notes: "Budget approved. Needs CRM for 12 sales reps. Decision by end of month.", value: 180000 },
  { name: "Michael Steyn", email: "michael@constructpro.co.za", phone: "+27 82 901 2345", company: "ConstructPro", status: "qualified" as const, source: "Website", notes: "Completed demo. Loves the simplicity. Comparing us with 2 others.", value: 72000 },
  { name: "Fatima Al-Rashid", email: "fatima@dubaiventures.ae", phone: "+971 50 123 4567", company: "Dubai Ventures", status: "qualified" as const, source: "Trade Show", notes: "Met at GITEX Africa. Wants to roll out across 3 countries.", value: 250000 },
  { name: "Sarah Mthembu", email: "sarah@healthfirst.co.za", phone: "+27 71 012 3456", company: "HealthFirst Clinics", status: "qualified" as const, source: "LinkedIn", notes: "4 clinic locations. Wants patient lead tracking. POPIA compliant.", value: 65000 },

  // PROPOSAL leads
  { name: "Ryan October", email: "ryan@mediamasters.co.za", phone: "+27 84 123 4567", company: "Media Masters", status: "proposal" as const, source: "Website", notes: "Sent formal proposal R95k/year. Negotiating 10% discount. Decision Friday.", value: 95000 },
  { name: "Zanele Khumalo", email: "zanele@edupathways.co.za", phone: "+27 83 234 5678", company: "EduPathways", status: "proposal" as const, source: "Referral", notes: "University lead management. Proposal for 500 student pipeline. Procurement process.", value: 145000 },
  { name: "André du Plessis", email: "andre@vineyardgroup.co.za", phone: "+27 82 345 6789", company: "Vineyard Group", status: "proposal" as const, source: "Cold Call", notes: "Wine estate portfolio. Wants tourism + wholesale lead separation.", value: 78000 },

  // WON leads
  { name: "Blessing Nkosi", email: "blessing@payfast.co.za", phone: "+27 72 456 7890", company: "PayFast Solutions", status: "won" as const, source: "LinkedIn", notes: "Signed! 2-year contract. Onboarding starts Monday. Champion deal!", value: 220000 },
  { name: "Lisa van Wyk", email: "lisa@travelcape.co.za", phone: "+27 83 567 8901", company: "TravelCape", status: "won" as const, source: "Referral", notes: "Closed after 3-week negotiation. Annual plan. Very happy customer.", value: 48000 },
  { name: "Oluwaseun Adeyemi", email: "seun@fintech360.ng", phone: "+234 805 678 9012", company: "FinTech360", status: "won" as const, source: "Trade Show", notes: "Lagos fintech company. Signed enterprise deal. Great reference.", value: 310000 },
  { name: "Karen Pretorius", email: "karen@beautybox.co.za", phone: "+27 71 678 9012", company: "BeautyBox SA", status: "won" as const, source: "Website", notes: "E-commerce beauty brand. Quick close - 2 weeks from first contact.", value: 35000 },
  { name: "Mohammed Patel", email: "mohammed@spiceworld.co.za", phone: "+27 84 789 0123", company: "Spice World Trading", status: "won" as const, source: "Referral", notes: "Import/export CRM. Referred by Blessing. Smooth deal.", value: 68000 },

  // LOST leads
  { name: "Jan de Klerk", email: "jan@oldmutualbroker.co.za", phone: "+27 82 890 1234", company: "Independent Broker", status: "lost" as const, source: "Cold Call", notes: "Went with Salesforce. Budget wasn't the issue - needed enterprise features we don't have yet.", value: 150000 },
  { name: "Grace Osei", email: "grace@accradigital.gh", phone: "+233 24 901 2345", company: "Accra Digital Agency", status: "lost" as const, source: "Website", notes: "Chose HubSpot free tier. Price sensitive. May revisit when they grow.", value: 22000 },
  { name: "Rudi Swanepoel", email: "rudi@steelworks.co.za", phone: "+27 83 012 3456", company: "SA Steelworks", status: "lost" as const, source: "Trade Show", notes: "Internal politics killed the deal. Champion left the company.", value: 185000 },
];

export default function SeedPage() {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [done, setDone] = useState(false);
  const [count, setCount] = useState(0);

  const handleSeed = async () => {
    if (!user) return;
    setSeeding(true);
    setCount(0);

    for (const lead of SAMPLE_LEADS) {
      await addLead({ ...lead, ownerId: user.uid });
      setCount((c) => c + 1);
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
              Populate your CRM with {SAMPLE_LEADS.length} realistic South African leads for testing.
              Includes leads across all pipeline stages with deal values.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {done ? (
              <div className="text-center py-4">
                <p className="text-green-600 font-semibold text-lg">
                  {SAMPLE_LEADS.length} leads created successfully!
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Go to the Dashboard or Leads page to see them.
                </p>
              </div>
            ) : (
              <>
                {seeding && (
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-sm text-muted-foreground">
                      Creating lead {count} of {SAMPLE_LEADS.length}...
                    </span>
                  </div>
                )}
                <Button onClick={handleSeed} disabled={seeding} className="w-full">
                  {seeding ? "Seeding..." : "Seed Sample Data"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
