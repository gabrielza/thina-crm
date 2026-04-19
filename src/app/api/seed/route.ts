import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// ─── Name pools ─────────────────────────────────────────
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
const LEAD_STATUSES = ["new","contacted","qualified","proposal","won","lost"] as const;
const ACTIVITY_TYPES = ["call","email","meeting","note"] as const;
const TASK_PRIORITIES = ["low","medium","high"] as const;
const ACTIVITY_SUBJECTS: Record<string, string[]> = {
  call: ["Intro call","Follow-up call","Discovery call","Qualification call","Demo scheduling call","Pricing discussion","Contract review call","Check-in call","Renewal discussion","Upsell call"],
  email: ["Sent pricing sheet","Proposal follow-up","Contract sent","Welcome email","Feature update shared","Meeting recap sent","Case study shared","ROI analysis sent","Invoice follow-up","Renewal reminder"],
  meeting: ["Product demo","Onboarding kickoff","Strategy session","QBR meeting","Executive briefing","Technical deep dive","Negotiation meeting","Contract signing","Team training","Roadmap review"],
  note: ["Competitor intel gathered","Decision timeline updated","Budget confirmed","Champion identified","Blocker identified","Stakeholder map updated","Risk assessment","Procurement process noted","Deal risk flagged","Expansion opportunity noted"],
};
const TASK_TITLES = [
  "Send proposal to {name}","Follow up with {name}","Prepare demo for {name}","Send case study to {name}",
  "Schedule training for {name}","Review contract for {name}","Update proposal for {name}","Quarterly check-in with {name}",
  "Send invoice to {name}","Prepare onboarding docs for {name}","Create custom pricing for {name}",
  "Research {company} competitors","Prepare ROI analysis for {name}","Schedule executive meeting with {name}",
];
const PHONE_PREFIXES = ["+27 82","+27 83","+27 84","+27 71","+27 72","+27 73","+27 60","+27 61"];
const INT_PHONE_PREFIXES = ["+971 50","+234 803","+254 722","+233 24","+86 138","+44 7700","+49 170","+33 6"];

// ─── Helpers ────────────────────────────────────────────
function rand<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randPhone(international = false): string {
  const prefix = international ? rand(INT_PHONE_PREFIXES) : rand(PHONE_PREFIXES);
  return `${prefix} ${randInt(100,999)} ${randInt(1000,9999)}`;
}
function randEmail(first: string, company: string): string {
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15);
  const tld = Math.random() > 0.7 ? rand([".com",".io",".ae",".ng",".ke"]) : ".co.za";
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
function daysAgo(n: number): Date { return new Date(Date.now() - n * 86400000); }
function formatDate(d: Date): string { return d.toISOString().slice(0, 10); }

function generatePerson(i: number) {
  const pool = i % 5 === 0 ? "int" : i % 3 === 0 ? "en" : "za";
  const firstName = pool === "int" ? rand(FIRST_NAMES_INT) : pool === "en" ? rand(FIRST_NAMES_EN) : rand(FIRST_NAMES_ZA);
  const lastName = pool === "int" ? rand(LAST_NAMES_INT) : rand(LAST_NAMES_ZA);
  const isIntl = pool === "int";
  const company = isIntl ? rand(COMPANIES_INT) : rand(COMPANIES_ZA);
  return { name: `${firstName} ${lastName}`, firstName, company, title: rand(TITLES), email: randEmail(firstName, company), phone: randPhone(isIntl) };
}

function randStatus() {
  const r = Math.random();
  if (r < 0.20) return "new";
  if (r < 0.38) return "contacted";
  if (r < 0.55) return "qualified";
  if (r < 0.68) return "proposal";
  if (r < 0.85) return "won";
  return "lost";
}

// ─── Batch writer using admin SDK (500 per batch, parallel) ─
async function adminBatchWrite(collectionName: string, docs: Record<string, unknown>[]) {
  const BATCH_SIZE = 500;
  const allIds: string[] = [];
  const batches: { promise: Promise<FirebaseFirestore.WriteResult[]>; ids: string[] }[] = [];

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = adminDb.batch();
    const chunk = docs.slice(i, i + BATCH_SIZE);
    const ids: string[] = [];
    for (const data of chunk) {
      const ref = adminDb.collection(collectionName).doc();
      batch.set(ref, { ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      ids.push(ref.id);
    }
    batches.push({ promise: batch.commit(), ids });
  }

  await Promise.all(batches.map(b => b.promise));
  batches.forEach(b => allIds.push(...b.ids));
  return allIds;
}

async function adminClearCollection(collectionName: string): Promise<number> {
  const BATCH_SIZE = 500;
  let deleted = 0;
  let hasMore = true;

  while (hasMore) {
    const snapshot = await adminDb.collection(collectionName).limit(BATCH_SIZE).get();
    if (snapshot.empty) { hasMore = false; break; }

    const batch = adminDb.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.size;

    if (snapshot.size < BATCH_SIZE) hasMore = false;
  }
  return deleted;
}

// ─── Route Handler ──────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Verify the user is authenticated via Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json();
    const action = body.action as string;

    if (action === "clear") {
      const collections = ["leads", "contacts", "activities", "tasks", "transactions"];
      let total = 0;
      // Clear in parallel
      const results = await Promise.all(collections.map(c => adminClearCollection(c)));
      total = results.reduce((a, b) => a + b, 0);
      return NextResponse.json({ cleared: total });
    }

    if (action === "seed") {
      const counts = { contacts: 200, leads: 500, activities: 300, tasks: 200, transactions: 150 };

      // 1. Generate and write contacts
      const contactDocs = Array.from({ length: counts.contacts }, (_, i) => {
        const p = generatePerson(i);
        return { name: p.name, email: p.email, phone: p.phone, company: p.company, title: p.title, notes: `${p.title} at ${p.company}. Seed #${i + 1}.`, ownerId: uid };
      });
      const contactIds = await adminBatchWrite("contacts", contactDocs);

      // 2. Generate and write leads
      const leadDocs = Array.from({ length: counts.leads }, (_, i) => {
        const p = generatePerson(i + counts.contacts);
        const status = randStatus();
        const contactId = i < counts.contacts ? contactIds[i] : contactIds[randInt(0, contactIds.length - 1)];
        const value = randValue();
        const source = rand(SOURCES);
        return { name: p.name, email: p.email, phone: p.phone, company: p.company, status, source, value, notes: `Source: ${source}. ${status} stage. R${value.toLocaleString()}.`, contactId, score: 0, ownerId: uid };
      });
      const leadIds = await adminBatchWrite("leads", leadDocs);

      // 3. Generate and write activities (parallel with tasks)
      const activityDocs = Array.from({ length: counts.activities }, (_, i) => {
        const type = rand(ACTIVITY_TYPES);
        const subject = rand(ACTIVITY_SUBJECTS[type]);
        return { type, subject, description: `${subject}. Auto-generated #${i + 1}.`, leadId: leadIds[randInt(0, leadIds.length - 1)], contactId: contactIds[randInt(0, contactIds.length - 1)], ownerId: uid };
      });

      // 4. Generate tasks
      const taskDocs = Array.from({ length: counts.tasks }, (_, i) => {
        const leadIdx = randInt(0, leadIds.length - 1);
        const lead = leadDocs[leadIdx];
        const title = rand(TASK_TITLES).replace("{name}", lead.name.split(" ")[0]).replace("{company}", lead.company);
        const priority = rand(TASK_PRIORITIES);
        const r = Math.random();
        let dueDate: string, status: string;
        if (r < 0.15) { dueDate = formatDate(daysAgo(randInt(1, 30))); status = "pending"; }
        else if (r < 0.25) { dueDate = formatDate(new Date()); status = "pending"; }
        else if (r < 0.60) { dueDate = formatDate(new Date(Date.now() + randInt(1, 45) * 86400000)); status = "pending"; }
        else { dueDate = formatDate(daysAgo(randInt(1, 60))); status = "completed"; }
        return { title, description: `Task for ${lead.name} at ${lead.company}.`, dueDate, priority, status, leadId: leadIds[leadIdx], contactId: contactIds[randInt(0, contactIds.length - 1)], ownerId: uid };
      });

      // Write activities and tasks in parallel
      await Promise.all([
        adminBatchWrite("activities", activityDocs),
        adminBatchWrite("tasks", taskDocs),
      ]);

      // 5. Generate and write transactions
      const transactionStages = ["otp_signed","fica_submitted","fica_verified","bond_applied","bond_approved","transfer_lodged","transfer_registered","commission_paid","fallen_through"] as const;
      const SA_STREETS = ["Sandton Drive","Jan Smuts Avenue","Rivonia Road","Main Road","Beach Road","Kloof Street","Long Street","Church Street","Voortrekker Road","Victoria Road","Nelson Mandela Boulevard","Oxford Road","Commissioner Street","Berea Road","Marine Parade","Umhlanga Rocks Drive","Lynnwood Road","Meiring Naudé Road","Hendrik Verwoerd Drive","Waterfall Drive"];
      const SA_SUBURBS = ["Sandton","Rosebank","Camps Bay","Constantia","Umhlanga","Ballito","Stellenbosch","Newlands","Houghton","Waterfall","Bryanston","Bedfordview","Centurion","Durbanville","Somerset West","Hermanus","Franschhoek","Paarl","Zimbali","Simbithi"];
      const SA_CITIES = ["Johannesburg","Cape Town","Durban","Pretoria","Port Elizabeth","Bloemfontein","East London","Nelspruit","Polokwane","Kimberley"];
      const CONVEYANCERS = ["Smith & Associates","Van der Merwe Attorneys","Pillay Legal","Adams & Partners","Botha Conveyancers","Naidoo & Sons Legal","Joubert Attorneys","Moyo Legal Group","De Klerk & Associates","Patel Conveyancers"];
      const BOND_ORIGINATORS = ["BetterBond","ooba","MortgageSA","HomeLoan Junction","BondExpert","FNB Home Loans Direct","Standard Bank Home","Nedbank Bond","ABSA Home Loans","SA HomeLoan"];

      const transactionDocs = Array.from({ length: counts.transactions }, (_, i) => {
        const street = `${randInt(1, 200)} ${rand(SA_STREETS)}`;
        const suburb = rand(SA_SUBURBS);
        const city = rand(SA_CITIES);
        const address = `${street}, ${suburb}, ${city}`;
        const salePrice = randInt(8, 80) * 100000; // R800K to R8M
        const commissionRate = [3, 3.5, 4, 5, 5.5, 6, 7.5][randInt(0, 6)];
        const grossCommission = Math.round(salePrice * (commissionRate / 100));
        const vatIncluded = Math.random() > 0.3;
        const vatAmount = vatIncluded ? Math.round(grossCommission * 0.15) : 0;

        // Random stage (weighted towards active)
        const stageWeights = [15, 12, 10, 12, 10, 8, 8, 15, 10]; // % distribution
        let r = randInt(1, 100), cumulative = 0, stageIdx = 0;
        for (let s = 0; s < stageWeights.length; s++) {
          cumulative += stageWeights[s];
          if (r <= cumulative) { stageIdx = s; break; }
        }
        const stage = transactionStages[stageIdx];

        // Build stage history
        const allPriorStages = transactionStages.slice(0, stageIdx + 1).filter(s => s !== "fallen_through");
        const stageHistory: { stage: string; date: string }[] = allPriorStages.map((s, j) => ({
          stage: s,
          date: formatDate(daysAgo(randInt((allPriorStages.length - j) * 5, (allPriorStages.length - j) * 15))),
        }));
        if (stage === "fallen_through") {
          stageHistory.push({ stage: "fallen_through", date: formatDate(daysAgo(randInt(1, 30))) });
        }

        const ficaBuyer = stageIdx >= 2 || Math.random() > 0.5;
        const ficaSeller = stageIdx >= 2 || Math.random() > 0.5;

        const buyerPerson = generatePerson(i + 2000);
        const sellerPerson = generatePerson(i + 3000);

        const dates: Record<string, string> = {};
        if (stageIdx >= 0) dates.otpSigned = stageHistory[0]?.date || formatDate(daysAgo(randInt(30, 90)));
        if (stageIdx >= 3) dates.bondApplied = stageHistory[3]?.date || "";
        if (stageIdx >= 4) dates.bondApproved = stageHistory[4]?.date || "";
        if (stageIdx >= 5) dates.transferLodged = stageHistory[5]?.date || "";
        if (stageIdx >= 6) dates.transferRegistered = stageHistory[6]?.date || "";
        if (stageIdx >= 7) dates.commissionPaid = stageHistory[7]?.date || "";

        // Associate some transactions with leads
        const leadId = i < leadIds.length ? leadIds[i] : leadIds[randInt(0, leadIds.length - 1)];
        const contactId = i < contactIds.length ? contactIds[i] : contactIds[randInt(0, contactIds.length - 1)];

        return {
          propertyAddress: address,
          salePrice,
          commissionRate,
          commissionAmount: grossCommission,
          vatIncluded,
          vatAmount,
          splits: [] as { party: string; percentage: number; amount: number }[],
          agentNetCommission: grossCommission,
          stage,
          stageHistory,
          ficaBuyer,
          ficaSeller,
          conveyancer: rand(CONVEYANCERS),
          bondOriginator: rand(BOND_ORIGINATORS),
          buyerName: buyerPerson.name,
          sellerName: sellerPerson.name,
          leadId,
          contactId,
          notes: `${address}. Sale: R${salePrice.toLocaleString()}. Commission: ${commissionRate}%.`,
          dates,
          ownerId: uid,
        };
      });

      await adminBatchWrite("transactions", transactionDocs);

      return NextResponse.json({
        seeded: counts.contacts + counts.leads + counts.activities + counts.tasks + counts.transactions,
        counts,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Seed API error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}
