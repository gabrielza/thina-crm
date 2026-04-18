"use client";

import { useState, useRef, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { batchWrite, clearCollection } from "@/lib/firestore";
import { useAuth } from "@/lib/hooks/use-auth";
import { format, subDays, addDays } from "date-fns";

// ─── Name pools ────────────────────────────────────────────
const FIRST_NAMES_ZA = [
  "Sipho","Thandi","Nomsa","Blessing","Zanele","Lerato","Thabo","Mpho","Kagiso","Naledi",
  "Tshepo","Palesa","Mandla","Sibusiso","Lindiwe","Buhle","Andile","Zinhle","Lungelo","Nkosazana",
  "Phumelele","Simphiwe","Ayanda","Noluthando","Sbusiso","Thandiwe","Mthunzi","Khwezi","Refilwe","Kabelo",
  "Dineo","Lesego","Thato","Karabo","Onalenna","Tumelo","Katlego","Boitumelo","Motheo","Keabetswe",
];
const FIRST_NAMES_EN = [
  "James","Emma","Ryan","Lisa","Michael","Sarah","David","Karen","Peter","Nicole",
  "André","Pieter","Rudi","Jan","Francois","Hendrik","Charlize","Megan","Olivia","Daniel",
  "Matthew","Jessica","Andrew","Rachel","Chris","Samantha","Dylan","Natasha","Brandon","Chloe",
  "Ethan","Amber","Marcus","Jade","Cameron","Bianca","Tyler","Gemma","Jordan","Lauren",
];
const FIRST_NAMES_INT = [
  "Fatima","Mohammed","Chen","Aisha","Oluwaseun","Grace","Abdul","Priya","Raj","Yuki",
  "Carlos","Sofia","Ahmed","Nadia","Hassan","Amira","Ali","Mei","Kenji","Isabela",
  "Omar","Layla","Kwame","Adaeze","Chidi","Ngozi","Tariq","Zara","Imran","Sana",
];
const LAST_NAMES_ZA = [
  "Ndlovu","Moyo","Dlamini","Nkosi","Khumalo","Molefe","Mthembu","Zulu","Mbeki","Buthelezi",
  "Naidoo","Govender","Pillay","Maharaj","Reddy","Chetty","Singh","Padayachee","Nair","Moodley",
  "van der Merwe","Botha","Viljoen","du Plessis","Pretorius","Steyn","de Klerk","Swanepoel","van Wyk","Joubert",
  "October","Davids","Adams","Williams","Petersen","Jacobs","Arendse","Hendricks","Daniels","Abrahams",
  "Ngcobo","Sithole","Mkhize","Cele","Shabalala","Madonsela","Mabaso","Nxumalo","Zwane","Gumede",
];
const LAST_NAMES_INT = [
  "Al-Rashid","Okonkwo","Osei","Wei","Yamamoto","Santos","Patel","Kim","Nguyen","Garcia",
  "Adeyemi","Hassan","Tanaka","Silva","Khan","Li","Park","Ahmad","Rodriguez","Fernandez",
];

const COMPANIES_ZA = [
  "TechStart SA","Cape Invest Group","RetailKing","PayFast Solutions","EduPathways","Media Masters",
  "TravelCape","SolarPowered SA","FarmTech Solutions","ConstructPro","HealthFirst Clinics","BlueWave Design",
  "Vineyard Group","SA Steelworks","BeautyBox SA","Spice World Trading","CloudNine Technologies","DataDriven SA",
  "GreenLeaf Organics","UrbanBuild Developments","SwiftLogistics","MediTech Africa","FinanceHub SA","PropertyPro",
  "TechBridge Solutions","Innovate Cape Town","Stellenbosch Digital","Pretoria Systems","JHB Cloud Services",
  "Durban IT Solutions","Port Elizabeth Tech","Bloemfontein Digital","Nelson Mandela Bay Systems","Limpopo Tech",
  "Mpumalanga Solutions","KZN Digital","Gauteng Systems","Free State IT","North West Tech","Western Cape Digital",
  "AfriPay","Quantum Consulting SA","SafeGuard Security","Oceanic Imports","PeakPerformance Training",
  "Nexus Engineering","Atlas Mining","Vanguard Properties","Heritage Hotels","Catalyst Marketing",
];
const COMPANIES_INT = [
  "Dubai Ventures","Lagos Tech Hub","Nairobi Solutions","FinTech360","Accra Digital Agency","Pacific Bridge Exports",
  "Mumbai Software Co","Singapore Trade Hub","São Paulo Digital","Cairo Innovations","Casablanca Tech",
  "Kampala Systems","Dar es Salaam IT","Lusaka Digital","Harare Technologies","Maputo Solutions",
  "London Analytics","Berlin Startups GmbH","Paris Digital SAS","Amsterdam Tech BV","Stockholm Innovation AB",
  "Toronto Solutions Inc","Sydney Tech Pty","Tokyo Systems KK","Seoul Digital Co","Shanghai Enterprise",
];

const TITLES = [
  "CEO","CTO","CFO","COO","VP Sales","VP Marketing","Head of Sales","Head of Marketing",
  "Director of Operations","Managing Director","Regional Director","Sales Manager","Marketing Manager",
  "Operations Manager","IT Director","Product Manager","Business Development Manager","Account Manager",
  "Director of Admissions","Chief Revenue Officer","Head of Growth","VP Engineering","Commercial Director",
  "Procurement Manager","General Manager","Technical Director","Finance Director","HR Director",
];

const SOURCES = ["Website","LinkedIn","Referral","Cold Call","Trade Show","Google Ads","Email Campaign","Partner","Social Media","Webinar"];
const LEAD_STATUSES: Array<"new" | "contacted" | "qualified" | "proposal" | "won" | "lost"> = ["new","contacted","qualified","proposal","won","lost"];
const ACTIVITY_TYPES: Array<"call" | "email" | "meeting" | "note"> = ["call","email","meeting","note"];
const TASK_PRIORITIES: Array<"low" | "medium" | "high"> = ["low","medium","high"];

const ACTIVITY_SUBJECTS: Record<string, string[]> = {
  call: [
    "Intro call","Follow-up call","Discovery call","Qualification call","Demo scheduling call",
    "Pricing discussion","Contract review call","Check-in call","Renewal discussion","Upsell call",
    "Cold call","Reference call","Escalation call","Technical review","Partner intro call",
  ],
  email: [
    "Sent pricing sheet","Proposal follow-up","Contract sent","Welcome email","Feature update shared",
    "Meeting recap sent","Case study shared","ROI analysis sent","Invoice follow-up","Renewal reminder",
    "Introductory email","Demo recording shared","Competitor comparison sent","Testimonial request","Newsletter",
  ],
  meeting: [
    "Product demo","Onboarding kickoff","Strategy session","QBR meeting","Executive briefing",
    "Technical deep dive","Negotiation meeting","Contract signing","Team training","Roadmap review",
    "Partnership discussion","Customer success review","Implementation planning","Budget review","Board presentation",
  ],
  note: [
    "Competitor intel gathered","Decision timeline updated","Budget confirmed","Champion identified","Blocker identified",
    "Stakeholder map updated","Risk assessment","Procurement process noted","Internal champion lost","Deal risk flagged",
    "Expansion opportunity noted","Churn risk detected","Feature request logged","Sentiment positive","Integration needs documented",
  ],
};

const TASK_TITLES = [
  "Send proposal to {name}","Follow up with {name}","Prepare demo for {name}","Send case study to {name}",
  "Schedule training for {name}","Review contract for {name}","Update proposal for {name}","Quarterly check-in with {name}",
  "Send invoice to {name}","Prepare onboarding docs for {name}","Create custom pricing for {name}",
  "Research {company} competitors","Prepare ROI analysis for {name}","Schedule executive meeting with {name}",
  "Send welcome pack to {name}","Update CRM notes for {name}","Prepare reference list for {name}",
  "Coordinate with legal for {name}","Build integration spec for {company}","Plan webinar for {company} team",
];

const PHONE_PREFIXES = ["+27 82","+27 83","+27 84","+27 71","+27 72","+27 73","+27 60","+27 61"];
const INT_PHONE_PREFIXES = ["+971 50","+234 803","+254 722","+233 24","+86 138","+44 7700","+49 170","+33 6","+61 4","+1 416"];

// ─── Generators ─────────────────────────────────────────

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randPhone(international = false): string {
  const prefix = international ? rand(INT_PHONE_PREFIXES) : rand(PHONE_PREFIXES);
  return `${prefix} ${randInt(100,999)} ${randInt(1000,9999)}`;
}
function randEmail(first: string, last: string, company: string): string {
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15);
  const tld = Math.random() > 0.7 ? rand([".com",".io",".ae",".ng",".ke",".gh",".uk",".de"]) : ".co.za";
  return `${first.toLowerCase()}@${domain}${tld}`;
}
function randValue(): number {
  const brackets = [
    { min: 5000, max: 25000, weight: 0.2 },
    { min: 25000, max: 75000, weight: 0.35 },
    { min: 75000, max: 150000, weight: 0.25 },
    { min: 150000, max: 350000, weight: 0.15 },
    { min: 350000, max: 1000000, weight: 0.05 },
  ];
  const r = Math.random();
  let cumulative = 0;
  for (const b of brackets) {
    cumulative += b.weight;
    if (r <= cumulative) return Math.round(randInt(b.min, b.max) / 1000) * 1000;
  }
  return 50000;
}
function randDate(daysBack: number): Date {
  return subDays(new Date(), randInt(0, daysBack));
}

function generatePerson(index: number) {
  const pool = index % 5 === 0 ? "int" : index % 3 === 0 ? "en" : "za";
  const firstName = pool === "int" ? rand(FIRST_NAMES_INT) : pool === "en" ? rand(FIRST_NAMES_EN) : rand(FIRST_NAMES_ZA);
  const lastName = pool === "int" ? rand(LAST_NAMES_INT) : rand(LAST_NAMES_ZA);
  const isIntl = pool === "int";
  const company = isIntl ? rand(COMPANIES_INT) : rand(COMPANIES_ZA);
  return {
    name: `${firstName} ${lastName}`,
    firstName,
    lastName,
    email: randEmail(firstName, lastName, company),
    phone: randPhone(isIntl),
    company,
    title: rand(TITLES),
    isInternational: isIntl,
  };
}

// ─── Weighted status distribution (realistic funnel) ────
function randStatus(): typeof LEAD_STATUSES[number] {
  const r = Math.random();
  if (r < 0.20) return "new";
  if (r < 0.38) return "contacted";
  if (r < 0.55) return "qualified";
  if (r < 0.68) return "proposal";
  if (r < 0.85) return "won";
  return "lost";
}

// ─── Main page component ────────────────────────────────

const COUNTS = { contacts: 200, leads: 500, activities: 300, tasks: 200 };
const TOTAL = COUNTS.contacts + COUNTS.leads + COUNTS.activities + COUNTS.tasks;

export default function SeedPage() {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [phase, setPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const abortRef = useRef(false);

  const handleClear = useCallback(async () => {
    if (!confirm("This will DELETE all existing data in Leads, Contacts, Activities, and Tasks. Are you sure?")) return;
    setClearing(true);
    setPhase("Clearing data...");
    const collections = ["leads", "contacts", "activities", "tasks"];
    let total = 0;
    for (const col of collections) {
      setPhase(`Clearing ${col}...`);
      const count = await clearCollection(col, (d) => setPhase(`Clearing ${col}... ${d} deleted`));
      total += count;
    }
    setPhase(`Cleared ${total} records.`);
    setClearing(false);
  }, []);

  const handleSeed = useCallback(async () => {
    if (!user) return;
    abortRef.current = false;
    setSeeding(true);
    setDone(false);
    setProgress(0);
    const uid = user.uid;
    let created = 0;

    const tick = (n: number) => {
      created += n;
      setProgress(Math.round((created / TOTAL) * 100));
    };

    try {
      // ── 1. CONTACTS ──────────────────────────────────
      setPhase(`Creating ${COUNTS.contacts} contacts...`);
      const contactDocs = Array.from({ length: COUNTS.contacts }, (_, i) => {
        const p = generatePerson(i);
        return {
          name: p.name, email: p.email, phone: p.phone,
          company: p.company, title: p.title,
          notes: `${p.title} at ${p.company}. Generated seed contact #${i + 1}.`,
          ownerId: uid,
        };
      });
      const contactIds = await batchWrite("contacts", contactDocs, (w) => {
        tick(w - (created));
        setPhase(`Creating contacts... ${w}/${COUNTS.contacts}`);
      });

      // ── 2. LEADS ─────────────────────────────────────
      setPhase(`Creating ${COUNTS.leads} leads...`);
      const leadDocs = Array.from({ length: COUNTS.leads }, (_, i) => {
        const p = generatePerson(i + COUNTS.contacts); // different offset for variety
        const status = randStatus();
        const contactId = i < COUNTS.contacts ? contactIds[i] : contactIds[randInt(0, contactIds.length - 1)];
        const value = randValue();
        const source = rand(SOURCES);
        const notes = [
          `Interested in our platform. Source: ${source}.`,
          status === "won" ? "Closed deal!" : status === "lost" ? "Deal lost to competitor." : `In ${status} stage.`,
          `Deal value: R${value.toLocaleString()}.`,
        ].join(" ");

        return {
          name: p.name, email: p.email, phone: p.phone,
          company: p.company, status, source, value,
          notes, contactId, score: 0, ownerId: uid,
        };
      });
      const leadIds = await batchWrite("leads", leadDocs, (w) => {
        tick(w - (created - COUNTS.contacts));
        setPhase(`Creating leads... ${w}/${COUNTS.leads}`);
      });

      // ── 3. ACTIVITIES ────────────────────────────────
      setPhase(`Creating ${COUNTS.activities} activities...`);
      const activityDocs = Array.from({ length: COUNTS.activities }, (_, i) => {
        const type = rand(ACTIVITY_TYPES);
        const subject = rand(ACTIVITY_SUBJECTS[type]);
        const leadId = leadIds[randInt(0, leadIds.length - 1)];
        const contactId = contactIds[randInt(0, contactIds.length - 1)];
        return {
          type, subject,
          description: `${subject}. Auto-generated activity #${i + 1} for testing.`,
          leadId, contactId, ownerId: uid,
        };
      });
      await batchWrite("activities", activityDocs, (w) => {
        tick(w - (created - COUNTS.contacts - COUNTS.leads));
        setPhase(`Creating activities... ${w}/${COUNTS.activities}`);
      });

      // ── 4. TASKS ─────────────────────────────────────
      setPhase(`Creating ${COUNTS.tasks} tasks...`);
      const taskDocs = Array.from({ length: COUNTS.tasks }, (_, i) => {
        const leadIdx = randInt(0, leadIds.length - 1);
        const lead = leadDocs[leadIdx];
        const titleTemplate = rand(TASK_TITLES);
        const title = titleTemplate.replace("{name}", lead.name.split(" ")[0]).replace("{company}", lead.company);
        const priority = rand(TASK_PRIORITIES);
        // Mix of overdue, today, upcoming, and completed
        const r = Math.random();
        let dueDate: string;
        let status: "pending" | "completed";
        if (r < 0.15) {
          // overdue
          dueDate = format(subDays(new Date(), randInt(1, 30)), "yyyy-MM-dd");
          status = "pending";
        } else if (r < 0.25) {
          // due today
          dueDate = format(new Date(), "yyyy-MM-dd");
          status = "pending";
        } else if (r < 0.60) {
          // upcoming
          dueDate = format(addDays(new Date(), randInt(1, 45)), "yyyy-MM-dd");
          status = "pending";
        } else {
          // completed
          dueDate = format(subDays(new Date(), randInt(1, 60)), "yyyy-MM-dd");
          status = "completed";
        }

        return {
          title, description: `Task for ${lead.name} at ${lead.company}.`,
          dueDate, priority, status,
          leadId: leadIds[leadIdx],
          contactId: contactIds[randInt(0, contactIds.length - 1)],
          ownerId: uid,
        };
      });
      await batchWrite("tasks", taskDocs, (w) => {
        tick(w - (created - COUNTS.contacts - COUNTS.leads - COUNTS.activities));
        setPhase(`Creating tasks... ${w}/${COUNTS.tasks}`);
      });

      setStats({
        Contacts: COUNTS.contacts,
        Leads: COUNTS.leads,
        Activities: COUNTS.activities,
        Tasks: COUNTS.tasks,
      });
      setProgress(100);
      setDone(true);
      setPhase("Done!");
    } catch (error) {
      console.error("Seed error:", error);
      setPhase(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSeeding(false);
    }
  }, [user]);

  return (
    <AppShell>
      <div className="max-w-lg mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Seed Sample Data</CardTitle>
            <p className="text-[13px] text-muted-foreground mt-1">
              Generate {TOTAL.toLocaleString()} realistic records to test all CRM features at scale.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Counts preview */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(COUNTS).map(([key, count]) => (
                <div key={key} className="rounded-lg border border-border/50 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{key}</p>
                  <p className="text-xl font-semibold tabular-nums mt-0.5">{count}</p>
                </div>
              ))}
            </div>

            {/* Progress */}
            {(seeding || done) && (
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[13px] text-muted-foreground">{phase}</p>
              </div>
            )}

            {/* Success stats */}
            {done && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="font-semibold text-primary text-sm">{TOTAL.toLocaleString()} records created!</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {Object.entries(stats).map(([key, count]) => (
                    <span key={key} className="text-[13px] text-muted-foreground">{count} {key.toLowerCase()}</span>
                  ))}
                </div>
                <p className="text-[12px] text-muted-foreground mt-2">Go to the Dashboard to see everything in action.</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleSeed} disabled={seeding || clearing} className="flex-1">
                {seeding ? `Seeding... ${progress}%` : done ? "Seed Again" : "Seed All Data"}
              </Button>
              <Button variant="outline" onClick={handleClear} disabled={seeding || clearing} className="text-destructive hover:text-destructive">
                {clearing ? "Clearing..." : "Clear All"}
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              Uses Firestore batch writes (450/batch) for speed. Typically takes 15-30 seconds.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
