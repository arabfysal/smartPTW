#!/usr/bin/env python3
"""Regenerate SmartPTW seed database — JSA-first workflow, 5 roles, no SIMOPS conflicts."""
import json
from datetime import datetime, timedelta, timezone

NOW = datetime.now(timezone.utc).replace(tzinfo=None, minute=0, second=0, microsecond=0)


def iso(dt):
    return dt.strftime('%Y-%m-%dT%H:%M:%S') + 'Z'


def h(stage, at, by, note):
    return {"stage": stage, "at": iso(at), "byUserId": by, "note": note}


# ---------------- Users (5 roles) ----------------
users = [
    {"id": "usr-001", "name": "Adamu Musa", "role": "Applicant", "email": "adamu.musa@nnpc.com",
     "department": "Maintenance & Facilities",
     "certifications": [
         {"type": "Welding Qualification", "number": "WQ-2024-118", "expiry": "2027-06-30"},
         {"type": "Confined Space Entry", "number": "CSE-2025-044", "expiry": "2027-03-31"},
         {"type": "Working at Height", "number": "WAH-2025-021", "expiry": "2027-09-30"},
         {"type": "Authorised Gas Tester", "number": "AGT-2025-063", "expiry": "2027-05-31"},
         {"type": "LOTO Authorised Person", "number": "LT-2025-012", "expiry": "2027-08-31"},
     ]},
    {"id": "usr-002", "name": "Chidinma Okafor", "role": "FSC Owner", "email": "chidinma.okafor@nnpc.com",
     "department": "Operations / Facility Safety Coordination", "certifications": []},
    {"id": "usr-003", "name": "Ibrahim Yusuf", "role": "HSE Officer", "email": "ibrahim.yusuf@nnpc.com",
     "department": "Health, Safety & Environment", "certifications": []},
    {"id": "usr-004", "name": "Oluwaseun Bakare", "role": "Contractor", "email": "s.bakare@arcomarine.com",
     "company": "Arco Marine & Oilfield Services",
     "certifications": [
         {"type": "Contractor HSE Passport", "number": "CHP-2025-201", "expiry": "2027-01-31"},
     ]},
    {"id": "usr-005", "name": "Ngozi Eze", "role": "Admin", "email": "ngozi.eze@nnpc.com",
     "department": "IT / Digital Transformation", "certifications": []},
]

# ---------------- Facilities ----------------
facilities = [
    {"id": "fac-twr", "name": "NNPC Towers (Corporate Headquarters)", "shortCode": "TWR",
     "location": "Herbert Macaulay Way, Central Business District, Abuja", "type": "non-operational"},
    {"id": "fac-oml", "name": "NEPL OML 111 — Oredo Field", "shortCode": "OML111",
     "location": "Oredo, Edo State (NNPC Exploration & Production Ltd)", "type": "operational"},
    {"id": "fac-wrpc", "name": "Warri Refining & Petrochemical Company (WRPC)", "shortCode": "WRPC",
     "location": "Ekpan, Warri, Delta State", "type": "operational"},
    {"id": "fac-krpc", "name": "Kaduna Refining & Petrochemical Company (KRPC)", "shortCode": "KRPC",
     "location": "Kaduna, Kaduna State", "type": "operational"},
    {"id": "fac-phrc", "name": "Port Harcourt Refining Company (PHRC)", "shortCode": "PHRC",
     "location": "Alesa-Eleme, Rivers State", "type": "operational"},
]

# ---------------- Assets ----------------
assets = [
    # NNPC Towers — 4 blocks, 3 basements, 11 floors, generator house, quadrangle
    {"id": "ast-twr-a", "facilityId": "fac-twr", "name": "Tower Block A (11 Floors)", "type": "Office Tower"},
    {"id": "ast-twr-b", "facilityId": "fac-twr", "name": "Tower Block B (11 Floors)", "type": "Office Tower"},
    {"id": "ast-twr-c", "facilityId": "fac-twr", "name": "Tower Block C (11 Floors)", "type": "Office Tower"},
    {"id": "ast-twr-d", "facilityId": "fac-twr", "name": "Tower Block D (11 Floors)", "type": "Office Tower"},
    {"id": "ast-twr-gen", "facilityId": "fac-twr", "name": "Central Generator House (4 x 1250 kVA)", "type": "Power Plant"},
    {"id": "ast-twr-chl", "facilityId": "fac-twr", "name": "Chilled Water Plant (HVAC)", "type": "HVAC Plant"},
    {"id": "ast-twr-fp", "facilityId": "fac-twr", "name": "Fire Water Pump House", "type": "Fire System"},
    {"id": "ast-twr-bsm", "facilityId": "fac-twr", "name": "Basement Levels B1–B3 (Car Park & Services)", "type": "Basement"},
    {"id": "ast-twr-lift", "facilityId": "fac-twr", "name": "Passenger Lifts Bank (Blocks A–D)", "type": "Vertical Transport"},
    {"id": "ast-twr-stp", "facilityId": "fac-twr", "name": "Sewage Treatment Plant", "type": "Utility"},
    # NEPL OML 111 — Oredo Field
    {"id": "ast-oml-fs", "facilityId": "fac-oml", "name": "Oredo Flow Station (30,000 bopd)", "type": "Flow Station"},
    {"id": "ast-oml-w6", "facilityId": "fac-oml", "name": "Oredo Well 6 — Long String (W-06L)", "type": "Wellhead"},
    {"id": "ast-oml-w9", "facilityId": "fac-oml", "name": "Oredo Well 9 — Short String (W-09S)", "type": "Wellhead"},
    {"id": "ast-oml-man", "facilityId": "fac-oml", "name": "Production Manifold (10-slot)", "type": "Manifold"},
    {"id": "ast-oml-ghf", "facilityId": "fac-oml", "name": "Oredo Gas Handling Facility (100 MMscf/d)", "type": "Gas Plant"},
    {"id": "ast-oml-tk1", "facilityId": "fac-oml", "name": "Crude Storage Tank TK-01 (50,000 bbl)", "type": "Storage Tank"},
    {"id": "ast-oml-tk2", "facilityId": "fac-oml", "name": "Crude Storage Tank TK-02 (50,000 bbl)", "type": "Storage Tank"},
    {"id": "ast-oml-agc", "facilityId": "fac-oml", "name": "AG Compressor Station", "type": "Compressor"},
    {"id": "ast-oml-flr", "facilityId": "fac-oml", "name": "HP Flare & Knockout Drum", "type": "Flare System"},
    {"id": "ast-oml-lact", "facilityId": "fac-oml", "name": "LACT Unit & Export Pumps", "type": "Export System"},
    # Refineries (light coverage)
    {"id": "ast-wrpc-cdu", "facilityId": "fac-wrpc", "name": "Crude Distillation Unit (CDU-1)", "type": "Process Unit"},
    {"id": "ast-wrpc-tk", "facilityId": "fac-wrpc", "name": "Tank Farm Area 2", "type": "Storage"},
    {"id": "ast-krpc-fcc", "facilityId": "fac-krpc", "name": "Fluid Catalytic Cracking Unit", "type": "Process Unit"},
    {"id": "ast-phrc-pp", "facilityId": "fac-phrc", "name": "Power Plant & Utilities", "type": "Utility"},
]

# ---------------- Locations (with blueprint map coords) ----------------
locations = [
    # NNPC Towers
    {"id": "loc-twr-roof-a", "facilityId": "fac-twr", "name": "Tower A — Roof Level (11th Floor)", "mapX": 30, "mapY": 24, "geo": {"lat": 9.0563, "lng": 7.4892}},
    {"id": "loc-twr-b2", "facilityId": "fac-twr", "name": "Tower B — Basement B2 Car Park", "mapX": 70, "mapY": 24, "geo": {"lat": 9.0565, "lng": 7.4898}},
    {"id": "loc-twr-c5", "facilityId": "fac-twr", "name": "Tower C — 5th Floor Office Wing", "mapX": 30, "mapY": 72, "geo": {"lat": 9.0559, "lng": 7.4890}},
    {"id": "loc-twr-d-b3", "facilityId": "fac-twr", "name": "Tower D — Basement B3 Services", "mapX": 70, "mapY": 72, "geo": {"lat": 9.0561, "lng": 7.4899}},
    {"id": "loc-twr-quad", "facilityId": "fac-twr", "name": "Central Quadrangle & Fountain", "mapX": 50, "mapY": 48, "geo": {"lat": 9.0562, "lng": 7.4895}},
    {"id": "loc-twr-gen", "facilityId": "fac-twr", "name": "Generator House Yard", "mapX": 88, "mapY": 88, "geo": {"lat": 9.0558, "lng": 7.4902}},
    {"id": "loc-twr-fp", "facilityId": "fac-twr", "name": "Fire Pump House", "mapX": 12, "mapY": 88, "geo": {"lat": 9.0557, "lng": 7.4887}},
    {"id": "loc-twr-lift-a", "facilityId": "fac-twr", "name": "Tower A — Lift Motor Room", "mapX": 38, "mapY": 30, "geo": {"lat": 9.0563, "lng": 7.4893}},
    # OML 111
    {"id": "loc-oml-fs", "facilityId": "fac-oml", "name": "Flow Station Process Area", "mapX": 46, "mapY": 38, "geo": {"lat": 6.2451, "lng": 5.8213}},
    {"id": "loc-oml-wc1", "facilityId": "fac-oml", "name": "Wellhead Cluster 1 (W-02 / W-06 / W-09)", "mapX": 14, "mapY": 22, "geo": {"lat": 6.2478, "lng": 5.8171}},
    {"id": "loc-oml-wc2", "facilityId": "fac-oml", "name": "Wellhead Cluster 2 (W-04 / W-11)", "mapX": 14, "mapY": 68, "geo": {"lat": 6.2419, "lng": 5.8169}},
    {"id": "loc-oml-tf", "facilityId": "fac-oml", "name": "Tank Farm — Dyke Area", "mapX": 76, "mapY": 26, "geo": {"lat": 6.2462, "lng": 5.8259}},
    {"id": "loc-oml-ghf", "facilityId": "fac-oml", "name": "Gas Handling Facility", "mapX": 66, "mapY": 58, "geo": {"lat": 6.2440, "lng": 5.8247}},
    {"id": "loc-oml-man", "facilityId": "fac-oml", "name": "Production Manifold Area", "mapX": 31, "mapY": 42, "geo": {"lat": 6.2456, "lng": 5.8195}},
    {"id": "loc-oml-flr", "facilityId": "fac-oml", "name": "Flare Area (200m Sterile Zone)", "mapX": 90, "mapY": 82, "geo": {"lat": 6.2421, "lng": 5.8271}},
    {"id": "loc-oml-lact", "facilityId": "fac-oml", "name": "LACT / Export Pump Skid", "mapX": 82, "mapY": 44, "geo": {"lat": 6.2452, "lng": 5.8266}},
    {"id": "loc-oml-camp", "facilityId": "fac-oml", "name": "Field Camp & Admin Block", "mapX": 24, "mapY": 88, "geo": {"lat": 6.2405, "lng": 5.8180}},
    # Refineries
    {"id": "loc-wrpc-cdu", "facilityId": "fac-wrpc", "name": "CDU Area — North Platform", "mapX": 40, "mapY": 32, "geo": {"lat": 5.5544, "lng": 5.7801}},
    {"id": "loc-wrpc-tf", "facilityId": "fac-wrpc", "name": "Tank Farm Area 2 — Dyke", "mapX": 74, "mapY": 62, "geo": {"lat": 5.5539, "lng": 5.7822}},
    {"id": "loc-krpc-fcc", "facilityId": "fac-krpc", "name": "FCC Unit Battery Limit", "mapX": 45, "mapY": 40, "geo": {"lat": 10.4581, "lng": 7.4460}},
    {"id": "loc-phrc-pp", "facilityId": "fac-phrc", "name": "Power Plant Switchgear Room", "mapX": 55, "mapY": 50, "geo": {"lat": 4.7772, "lng": 7.1266}},
]

# ---------------- Work Type Rules (with JSA templates) ----------------
PPE_BASE = ["Safety boots", "Hard hat", "Safety glasses", "Gloves"]


def rule(id_, label, permits_, risk, ppe, certs, docs, gas, iso_req, tbt, env, tpl):
    return {"id": id_, "label": label, "requiredPermitTypes": permits_, "baseRiskCategory": risk,
            "requiredPPE": ppe, "requiredCertificates": certs, "requiredDocuments": docs,
            "gasTestRequired": gas, "isolationRequired": iso_req, "toolboxTalkRequired": tbt,
            "environmentalRequirements": env, "jsaTemplate": tpl}


def row(step, hazards, risks, level, controls, party):
    return {"jobStep": step, "potentialHazards": hazards, "risks": risks, "riskLevel": level,
            "controls": controls, "actionParty": party}


workTypeRules = [
    rule("hot-work", "Hot Work (Welding / Cutting / Grinding)", ["Hot Work Permit"], "High",
         PPE_BASE + ["Fire retardant coveralls", "Face shield", "Welding gauntlets"],
         ["Welding Qualification"],
         ["Method Statement", "Fire Watch Plan", "Equipment Certificate"],
         True, False, True, ["Fire blanket & extinguisher at point of work", "Hot work area screened"],
         [row("Isolate and screen the work area, position fire watch",
              "Flying sparks, flammable materials nearby", "Fire, burns to personnel", "H",
              "Erect fire-retardant screens; remove combustibles within 10m; fire watch with extinguisher", "Job Owner / Fire Watch"),
          row("Carry out welding / cutting / grinding activity",
              "Arc radiation, hot metal, fumes", "Eye injury, burns, inhalation of fumes", "H",
              "Full welding PPE; local exhaust ventilation; only certified welders", "Welder / Supervisor"),
          row("Post-work fire watch (minimum 30 minutes)",
              "Smouldering materials", "Delayed fire outbreak", "M",
              "Maintain fire watch 30 min after completion; final area inspection", "Fire Watch")]),
    rule("confined-space", "Confined Space Entry", ["Confined Space Entry Permit"], "Critical",
         PPE_BASE + ["Full body harness", "SCBA or airline respirator", "Gas detector (personal)", "Communication device"],
         ["Confined Space Entry"],
         ["Method Statement", "Rescue Plan", "Confined Space Entry Procedure"],
         True, True, True, ["Continuous ventilation", "Standby rescue team at entry point"],
         [row("Isolate, drain, purge and ventilate the vessel/space",
              "Toxic / flammable atmosphere, residual product", "Asphyxiation, poisoning, explosion", "H",
              "Positive isolation with blinds; purge and force-ventilate; verify LEL/O2/H2S before entry", "Job Owner / Operations"),
          row("Gas test and authorise entry",
              "Oxygen deficiency, H2S, hydrocarbons", "Loss of consciousness, fatality", "H",
              "Authorised gas tester certifies atmosphere; continuous monitoring; entry log maintained", "Authorised Gas Tester"),
          row("Execute work inside the confined space",
              "Restricted egress, heat stress, engulfment", "Entrapment, exhaustion", "H",
              "Standby man at manway; lifeline & harness; rotation of personnel; rescue tripod rigged", "Entrants / Standby Man")]),
    rule("electrical-work", "Electrical Work (LV/HV)", ["Electrical Work Permit"], "High",
         PPE_BASE + ["Arc flash suit", "Insulated gloves (Class 0)", "Dielectric boots"],
         ["Electrical Competency (NEMSA)"],
         ["Method Statement", "Isolation & LOTO Plan", "Single Line Diagram"],
         False, True, True, ["Danger tags on all isolation points"],
         [row("Identify circuits and apply LOTO isolation",
              "Live conductors, stored energy", "Electrocution, arc flash", "H",
              "Isolate at source; lock-out tag-out; prove dead with tested voltage detector", "Job Owner / Electrical AP"),
          row("Carry out electrical repair / installation",
              "Inadvertent re-energisation, faulty tools", "Shock, burns", "H",
              "Insulated tools; rubber matting; permit-controlled re-energisation only", "Electrician"),
          row("Test, remove locks and restore supply",
              "Premature energisation with personnel exposed", "Electrocution of team members", "M",
              "Head-count before de-isolation; staged re-energisation; final function test", "Electrical AP")]),
    rule("work-at-height", "Work at Height (>1.8m)", ["Work at Height Permit"], "High",
         PPE_BASE + ["Full body harness with double lanyard", "Helmet with chin strap"],
         ["Working at Height"],
         ["Method Statement", "Rescue Plan", "Scaffold / Access Certificate"],
         False, False, True, ["Drop zone barricaded below work area"],
         [row("Erect / inspect access (scaffold, MEWP or ladder)",
              "Defective access equipment", "Fall of personnel from height", "H",
              "Green-tagged scaffold only; competent person inspection; MEWP daily checks", "Scaffold Inspector"),
          row("Carry out the task at height with 100% tie-off",
              "Unprotected edges, dropped objects", "Fatal fall, struck-by below", "H",
              "Double lanyard 100% tie-off; tool lanyards; barricade & sign drop zone", "Job Owner / Workers"),
          row("Lower tools & materials and demobilise access",
              "Falling objects during demob", "Injury to persons below", "M",
              "Controlled lowering with rope & bucket; exclusion zone until demob complete", "Workers")]),
    rule("excavation", "Excavation & Ground Disturbance", ["Excavation Permit"], "Medium",
         PPE_BASE + ["High-visibility vest"],
         [],
         ["Method Statement", "Buried Services Drawing", "Shoring Plan"],
         False, False, True, ["Spoil placed min. 1m from edge", "Dewatering plan where required"],
         [row("Scan and mark buried services before digging",
              "Buried cables & pipelines", "Cable strike, pipeline rupture", "H",
              "Service drawings reviewed; cable avoidance tool scan; hand-dig trial pits near services", "Job Owner / Surveyor"),
          row("Excavate and support the trench",
              "Collapse of trench walls", "Burial / crush injuries", "M",
              "Batter or shore sides >1.2m; ladder access every 7.5m; barricade perimeter", "Excavation Crew"),
          row("Backfill and reinstate the area",
              "Open excavation left unattended", "Falls into excavation", "L",
              "Compact backfill in layers; remove barricades only after reinstatement", "Crew / Supervisor")]),
    rule("cold-work", "Cold Work (General Maintenance)", ["Cold Work Permit"], "Low",
         PPE_BASE,
         [],
         ["Method Statement", "Tool Inspection Checklist"],
         False, False, True, [],
         [row("Prepare work area and inspect tools",
              "Defective hand tools, poor housekeeping", "Cuts, trips", "L",
              "Pre-use tool inspection; clear walkways; waste segregation", "Job Owner"),
          row("Carry out maintenance activity",
              "Manual handling, pinch points", "Strains, crushed fingers", "M",
              "Correct lifting technique; two-man lift >25kg; gloves worn", "Technicians")]),
    rule("lifting-operations", "Lifting Operations (Crane / Hoist)", ["Lifting Permit"], "High",
         PPE_BASE + ["High-visibility vest"],
         ["Rigger / Banksman Certificate"],
         ["Lifting Plan", "Crane & Rigging Certificates", "Load Charts"],
         False, False, True, ["Lift exclusion zone barricaded"],
         [row("Position and set up the crane",
              "Unstable ground, overhead lines", "Crane overturn, electrocution", "H",
              "Ground bearing assessment; outrigger mats; maintain clearance from OH lines", "Lift Supervisor"),
          row("Rig the load and perform trial lift",
              "Failure of rigging, unbalanced load", "Dropped load", "H",
              "Certified slings & shackles; tag lines; trial lift 300mm hold-point", "Rigger / Banksman"),
          row("Execute lift and land the load",
              "Personnel under suspended load", "Fatality from falling load", "H",
              "Exclusion zone enforced; banksman sole signaller; no man under load", "Banksman / All")]),
    rule("radiography", "Radiography (NDT)", ["Radiography Permit"], "Critical",
         PPE_BASE + ["Dosimeter badge"],
         ["NIS Radiography License"],
         ["Method Statement", "Radiation Safety Plan", "Source Certificate"],
         False, False, True, ["Controlled area barriers at 7.5 µSv/h boundary", "Night work preferred"],
         [row("Cordon controlled area and post radiation signage",
              "Ionising radiation exposure", "Radiation dose to personnel", "H",
              "Survey meter verification of barrier distance; warning lights & signage; area cleared", "RSO / Radiographer"),
          row("Expose source and take radiographs",
              "Source stuck in guide tube", "Uncontrolled exposure", "H",
              "Certified radiographers only; source tracking log; emergency retrieval kit on site", "Radiographer"),
          row("Return source and survey clearance",
              "Residual radiation", "Exposure after work", "M",
              "Survey confirm source secured in container; barriers removed only after RSO clearance", "RSO")]),
    rule("chemical-handling", "Chemical Handling & Transfer", ["Chemical Work Permit"], "Medium",
         PPE_BASE + ["Chemical splash suit", "Face shield", "Chemical-resistant gloves"],
         [],
         ["Method Statement", "SDS Sheets", "Spill Response Plan"],
         False, False, True, ["Spill kit at point of work", "Bunded storage for containers"],
         [row("Review SDS and prepare transfer equipment",
              "Incompatible materials, unlabelled containers", "Chemical reaction, exposure", "M",
              "SDS review in toolbox talk; verify labels; earthing/bonding for flammables", "Job Owner"),
          row("Transfer / handle chemicals",
              "Splash, spill, vapour release", "Chemical burns, inhalation", "M",
              "Splash PPE; transfer pumps with dry-break couplings; work upwind", "Handlers"),
          row("Dispose of waste and decontaminate",
              "Contaminated PPE & waste", "Environmental contamination", "L",
              "Waste to licensed stream; decontamination station; spill kit replenished", "Handlers / HSE")]),
    rule("hvac-maintenance", "HVAC & Generator Maintenance", ["Mechanical Work Permit"], "Medium",
         PPE_BASE + ["Hearing protection"],
         [],
         ["Method Statement", "Isolation & LOTO Plan", "OEM Service Checklist"],
         False, True, True, ["Refrigerant recovery to certified cylinders"],
         [row("Isolate the unit (electrical & mechanical) and apply LOTO",
              "Rotating parts, stored electrical energy", "Entanglement, shock", "H",
              "LOTO on breaker & fuel supply; prove dead; release stored pressure", "Job Owner / Technician"),
          row("Service the generator / HVAC unit",
              "Hot surfaces, fuel & refrigerant leaks", "Burns, fire, refrigerant exposure", "M",
              "Allow cool-down; drip trays; ventilate plant room; hot surface gloves", "Technician"),
          row("De-isolate, test-run and reinstate",
              "Unexpected start-up with guards removed", "Entanglement injury", "M",
              "Guards refitted before de-isolation; test-run observed; log readings", "Technician / Supervisor")]),
]

# ---------------- JSA + Permit generation ----------------
FAC_CODE = {f["id"]: f["shortCode"] for f in facilities}
RULES = {r["id"]: r for r in workTypeRules}
RISK_ORDER = {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}

jsas, permits, documents, jsaReviews = [], [], [], []
hseReviews, fscReviews, isolationCertificates, gasTests = [], [], [], []
contractorAcceptances, finalApprovals, monitoringEvents = [], [], []
completions, siteVerifications, closeouts, auditTrail, notifications = [], [], [], [], []
simopsAssessments, validationChecks, revalidations = [], [], []

_audit_n = [0]


def audit(pid, actor, action, detail, at):
    _audit_n[0] += 1
    auditTrail.append({"id": f"aud-{_audit_n[0]:03d}", "permitId": pid, "actorId": actor,
                       "action": action, "detail": detail, "at": iso(at)})


def derive(work_types):
    matched = [RULES[w] for w in work_types]
    risk = max((r["baseRiskCategory"] for r in matched), key=lambda c: RISK_ORDER[c])
    ppe, certs, docs, env = [], [], [], []
    for r in matched:
        for x in r["requiredPPE"]:
            if x not in ppe: ppe.append(x)
        for x in r["requiredCertificates"]:
            if x not in certs: certs.append(x)
        for x in r["requiredDocuments"]:
            if x not in docs: docs.append(x)
        for x in r["environmentalRequirements"]:
            if x not in env: env.append(x)
    return {
        "riskCategory": risk,
        "requiredPermitTypes": [p for r in matched for p in r["requiredPermitTypes"]],
        "requiredPPE": ppe, "requiredCertificates": certs, "requiredDocuments": docs,
        "environmentalRequirements": env,
        "gasTestRequired": any(r["gasTestRequired"] for r in matched),
        "isolationRequired": any(r["isolationRequired"] for r in matched),
        "toolboxTalkRequired": any(r["toolboxTalkRequired"] for r in matched),
    }


def jsa_rows(work_types):
    rows_, sn = [], 0
    for w in work_types:
        for t in RULES[w]["jsaTemplate"]:
            sn += 1
            rows_.append({"sn": sn, **t})
    return rows_


_jsa_n = [0]


def make_jsa(fac, asset, loc, work_types, desc, status, start_off_h, dur_h, created_off_h, permit_id=None, contractor=False):
    _jsa_n[0] += 1
    n = _jsa_n[0]
    d = derive(work_types)
    created = NOW + timedelta(hours=created_off_h)
    start = NOW + timedelta(hours=start_off_h)
    jid = f"jsa-{n:03d}"
    serial = f"JSA-{FAC_CODE[fac]}-2026-{n:03d}"
    hist = [h("draft", created, "usr-001", "JSA prepared by job owner")]
    fsc_by = fsc_at = hse_by = hse_at = None
    if status in ("fscReview", "hseReview", "approved"):
        hist.append(h("fscReview", created + timedelta(hours=1), "usr-001", "Submitted for FSC Owner review"))
    if status in ("hseReview", "approved"):
        t = created + timedelta(hours=3)
        fsc_by, fsc_at = "usr-002", iso(t)
        hist.append(h("hseReview", t, "usr-002", "FSC Owner approved — forwarded to HSE"))
        jsaReviews.append({"id": f"jrev-{n:03d}a", "jsaId": jid, "reviewerRole": "FSC Owner", "reviewerId": "usr-002",
                           "status": "approved", "comments": "Job steps and controls adequate for the scope.",
                           "requestedAmendments": "", "reviewedAt": iso(t)})
    if status == "approved":
        t = created + timedelta(hours=5)
        hse_by, hse_at = "usr-003", iso(t)
        hist.append(h("approved", t, "usr-003", "HSE endorsed — applicant may raise PTW"))
        jsaReviews.append({"id": f"jrev-{n:03d}b", "jsaId": jid, "reviewerRole": "HSE Officer", "reviewerId": "usr-003",
                           "status": "approved", "comments": "Controls verified against HSE requirements. Endorsed.",
                           "requestedAmendments": "", "reviewedAt": iso(t)})
    jsas.append({
        "id": jid, "serialNo": serial, "applicantId": "usr-001",
        "inHouseOrContractor": "Contractor" if contractor else "In-House",
        "emergencyNo": "0700-NNPC-HSE (0700-6672-473)",
        "jobDescription": desc,
        "facilityId": fac, "assetId": asset, "locationId": loc,
        "natureOfWork": work_types,
        "scheduledStart": iso(start), "scheduledEnd": iso(start + timedelta(hours=dur_h)),
        "riskCategory": d["riskCategory"],
        "requiredPPE": d["requiredPPE"], "requiredCertificates": d["requiredCertificates"],
        "requiredDocuments": d["requiredDocuments"],
        "gasTestRequired": d["gasTestRequired"], "isolationRequired": d["isolationRequired"],
        "simopsRequired": False, "toolboxTalkRequired": d["toolboxTalkRequired"],
        "rows": jsa_rows(work_types),
        "stopWorkConditions": "Gas alarm activation; weather deterioration (lightning/high wind); loss of communication; any unplanned release; emergency siren.",
        "comments": "",
        "status": status,
        "fscReviewedBy": fsc_by, "fscReviewedAt": fsc_at,
        "hseApprovedBy": hse_by, "hseApprovedAt": hse_at,
        "permitId": permit_id,
        "createdAt": iso(created), "updatedAt": iso(created),
        "history": hist,
    })
    return jid, d, start, dur_h


_pmt_n = [0]
_doc_n = [0]

PERMIT_STAGE_CHAIN = ["draft", "hseReview", "fscOperationalReview", "contractorAcceptance",
                      "finalApproval", "active", "completionPending", "fscCloseout", "closed"]


def make_permit(fac, asset, loc, work_types, desc, status, start_off_h, dur_h, created_off_h, contractor=True):
    _pmt_n[0] += 1
    n = _pmt_n[0]
    pid = f"pmt-{n:03d}"
    jid, d, start, _ = make_jsa(fac, asset, loc, work_types, desc, "approved",
                                start_off_h, dur_h, created_off_h - 8, permit_id=pid, contractor=contractor)
    created = NOW + timedelta(hours=created_off_h)
    pnum = f"PTW-{FAC_CODE[fac]}-2026-{n:03d}"
    hist = [h("draft", created, "usr-001", f"Permit raised from approved JSA {jid}")]
    audit(pid, "usr-001", "permit_created", f"{pnum} raised from approved JSA", created)

    # documents — ALL required docs uploaded
    for doc_type in d["requiredDocuments"]:
        _doc_n[0] += 1
        documents.append({"id": f"doc-{_doc_n[0]:03d}", "permitId": pid, "type": doc_type,
                          "fileName": doc_type.replace(" ", "_").replace("/", "-").lower() + ".pdf",
                          "uploadedAt": iso(created + timedelta(minutes=20)), "uploadedBy": "usr-001",
                          "status": "uploaded"})

    stages = PERMIT_STAGE_CHAIN[:PERMIT_STAGE_CHAIN.index(status) + 1] if status != "suspended" else \
        ["draft", "hseReview", "fscOperationalReview", "contractorAcceptance", "finalApproval", "active", "suspended"]

    t = created
    for st in stages[1:]:
        t = t + timedelta(hours=2)
        if st == "hseReview":
            hist.append(h(st, t, "usr-001", "Documents complete — submitted for HSE review"))
            audit(pid, "usr-001", "permit_submitted", "All documents verified, submitted for HSE review", t)
        elif st == "fscOperationalReview":
            hist.append(h(st, t, "usr-003", "HSE endorsed — proceeding to FSC operational review"))
            audit(pid, "usr-003", "hse_endorsed", "HSE review endorsed with comments", t)
            hseReviews.append({"id": f"hse-{n:03d}", "permitId": pid, "inspectorId": "usr-003",
                               "checklist": [{"item": i, "passed": True} for i in
                                             ["Worksite readiness verified", "Personnel competency confirmed",
                                              "PPE requirements met", "Emergency arrangements confirmed",
                                              "Environmental controls in place"]],
                               "decision": "approved", "comments": "Site inspected. Endorsed for operational review.",
                               "reviewedAt": iso(t)})
        elif st == "contractorAcceptance":
            hist.append(h(st, t, "usr-002", "Operational review closed — all gates approved"))
            audit(pid, "usr-002", "operational_review_closed", "FSC operational review completed", t)
            fscReviews.append({"id": f"fsc-{n:03d}", "permitId": pid, "reviewerId": "usr-002",
                               "conflicts": [], "decision": "approved", "reviewedAt": iso(t)})
            if d["isolationRequired"]:
                isolationCertificates.append({"id": f"iso-{n:03d}", "permitId": pid, "type": "electrical",
                                              "isolationPoints": "Main breaker + local isolator, valves V-101/V-102 blinded",
                                              "lotoVerified": True, "status": "approved",
                                              "submittedBy": "usr-001", "submittedAt": iso(t - timedelta(hours=1)),
                                              "approvedBy": "usr-002", "approvedAt": iso(t)})
            if d["gasTestRequired"]:
                gasTests.append({"id": f"gas-{n:03d}", "permitId": pid,
                                 "readings": {"o2": "20.9%", "lel": "0%", "h2s": "0 ppm", "co": "1 ppm", "other": ""},
                                 "testedAt": iso(t - timedelta(hours=1)), "validUntil": iso(t + timedelta(hours=71)),
                                 "status": "approved", "submittedBy": "usr-001",
                                 "submittedAt": iso(t - timedelta(hours=1)),
                                 "approvedBy": "usr-002", "approvedAt": iso(t)})
        elif st == "finalApproval":
            hist.append(h(st, t, "usr-004", "Contractor accepted permit conditions"))
            audit(pid, "usr-004", "contractor_accepted", "Contractor signed acceptance incl. NNPC 18:00 suspension rule", t)
            contractorAcceptances.append({"id": f"ca-{n:03d}", "permitId": pid, "contractorId": "usr-004",
                                          "acceptedItems": ["all"], "signedAt": iso(t)})
        elif st == "active":
            hist.append(h(st, t, "usr-002", "Final authorisation signed — permit ACTIVE"))
            audit(pid, "usr-002", "permit_activated", "FSC Owner signed final authorisation", t)
            finalApprovals.append({"id": f"fa-{n:03d}", "permitId": pid, "approverId": "usr-002", "signedAt": iso(t)})
        elif st == "suspended":
            hist.append(h(st, t, "usr-002", "Daily 18:00 suspension — revalidation required next morning"))
            audit(pid, "usr-002", "permit_suspended", "Automatic end-of-day suspension (18:00 rule)", t)
            monitoringEvents.append({"id": f"mon-{n:03d}", "permitId": pid, "type": "Daily 18:00 suspension",
                                     "detail": "Permit suspended per NNPC daily suspension policy. Revalidate with FSC Owner.",
                                     "detectedAt": iso(t), "resolvedAt": "", "status": "open"})
        elif st == "completionPending":
            hist.append(h(st, t, "usr-004", "Contractor requested work completion — awaiting HSE site verification"))
            completions.append({"id": f"cmp-{n:03d}", "permitId": pid, "confirmedBy": "usr-004",
                                "checklist": [{"item": i, "done": True} for i in
                                              ["Work scope completed", "Tools & equipment removed",
                                               "Waste cleared", "Area housekeeping done", "Isolations ready for removal"]],
                                "completedAt": iso(t)})
            audit(pid, "usr-004", "completion_requested", "Contractor requested completion — HSE to verify on site", t)
        elif st == "fscCloseout":
            hist.append(h(st, t, "usr-003", "HSE verified completion on site — awaiting FSC Owner closeout"))
            siteVerifications.append({"id": f"sv-{n:03d}", "permitId": pid, "verifiedBy": "usr-003",
                                      "checklist": [{"item": i, "done": True} for i in
                                                    ["Site restored", "Isolations removed", "Barricades removed",
                                                     "No residual hazards", "Equipment demobilised"]],
                                      "verifiedAt": iso(t)})
            audit(pid, "usr-003", "hse_verified_completion", "HSE post-work site verification complete", t)
        elif st == "closed":
            hist.append(h(st, t, "usr-002", "FSC Owner closeout complete — permit closed & archived; completion certificate issued"))
            closeouts.append({"id": f"co-{n:03d}", "permitId": pid, "hseClosedBy": "usr-003", "hseClosedAt": iso(t - timedelta(hours=2)),
                              "fscClosedBy": "usr-002", "fscClosedAt": iso(t),
                              "archivedRefs": [{"name": "Permit pack", "type": "pdf", "ref": f"archive/{pnum}.pdf"},
                                               {"name": "Completion certificate", "type": "certificate", "ref": f"archive/{pnum}-certificate.pdf"}]})
            audit(pid, "usr-002", "permit_closed", "FSC closeout complete, records archived, completion certificate issued", t)

    permits.append({
        "id": pid, "permitNumber": pnum, "jsaId": jid,
        "facilityId": fac, "assetId": asset, "locationId": loc,
        "natureOfWork": work_types, "riskCategory": d["riskCategory"],
        "requiredPermitTypes": d["requiredPermitTypes"],
        "requiredApprovers": ["HSE Officer", "FSC Owner", "Contractor"],
        "requiredPPE": d["requiredPPE"], "requiredCertificates": d["requiredCertificates"],
        "requiredDocuments": d["requiredDocuments"],
        "gasTestRequired": d["gasTestRequired"], "isolationRequired": d["isolationRequired"],
        "simopsRequired": False, "toolboxTalkRequired": d["toolboxTalkRequired"],
        "environmentalRequirements": d["environmentalRequirements"],
        "status": status, "applicantId": "usr-001",
        "contractorId": "usr-004" if contractor else None,
        "scheduledStart": iso(start), "scheduledEnd": iso(start + timedelta(hours=dur_h)),
        "createdAt": iso(created), "updatedAt": iso(t), "history": hist,
    })
    return pid


# ---- Standalone JSAs (pre-permit pipeline) — each at a DIFFERENT location, no overlaps ----
make_jsa("fac-twr", "ast-twr-gen", "loc-twr-gen", ["hvac-maintenance"],
         "Quarterly service of Generator No. 2 (1250 kVA) — oil change, filter replacement and load bank test",
         "draft", 30, 8, -2)
make_jsa("fac-oml", "ast-oml-fs", "loc-oml-fs", ["hot-work"],
         "Weld repair of corroded handrail sections on the flow station process deck",
         "fscReview", 54, 10, -6, contractor=True)
make_jsa("fac-twr", "ast-twr-a", "loc-twr-roof-a", ["work-at-height"],
         "Replacement of aviation warning lights and facade inspection at Tower A roof level",
         "hseReview", 78, 6, -10, contractor=True)
make_jsa("fac-oml", "ast-oml-tk1", "loc-oml-tf", ["confined-space"],
         "Internal inspection and sludge removal of Crude Storage Tank TK-01",
         "approved", 102, 12, -14, contractor=True)

# ---- Permits (each with its own approved JSA) — distinct locations/times, NO SIMOPS conflicts ----
make_permit("fac-twr", "ast-twr-chl", "loc-twr-d-b3", ["electrical-work"],
            "Replacement of chilled water pump motor starter panel in Basement B3", "draft", 26, 8, -3)
make_permit("fac-oml", "ast-oml-man", "loc-oml-man", ["cold-work"],
            "Torque check and re-greasing of production manifold valves", "hseReview", 28, 6, -6)
make_permit("fac-twr", "ast-twr-lift", "loc-twr-lift-a", ["hvac-maintenance"],
            "Lift No. A2 gearbox overhaul in Tower A lift motor room", "fscOperationalReview", 25, 10, -10)
make_permit("fac-oml", "ast-oml-ghf", "loc-oml-ghf", ["hot-work"],
            "Welding of pipe support brackets at the Gas Handling Facility inlet manifold", "fscOperationalReview", 27, 8, -12, contractor=True)
make_permit("fac-twr", "ast-twr-b", "loc-twr-b2", ["cold-work"],
            "Repainting and floor line marking of Basement B2 car park", "contractorAcceptance", 30, 16, -18, contractor=True)
make_permit("fac-oml", "ast-oml-lact", "loc-oml-lact", ["electrical-work"],
            "Replacement of LACT unit metering panel UPS batteries", "finalApproval", 29, 6, -20)
make_permit("fac-twr", "ast-twr-fp", "loc-twr-fp", ["hvac-maintenance"],
            "Annual overhaul of jockey pump and pressure vessel inspection at Fire Pump House", "active", -3, 30, -30)
make_permit("fac-oml", "ast-oml-w6", "loc-oml-wc1", ["hot-work", "work-at-height"],
            "Wellhead cellar deck grating replacement at Oredo Well 6 (W-06L)", "active", -5, 36, -36, contractor=True)
make_permit("fac-wrpc", "ast-wrpc-cdu", "loc-wrpc-cdu", ["cold-work"],
            "Insulation cladding repair on CDU-1 preheat exchanger train", "suspended", -20, 48, -48, contractor=True)
make_permit("fac-twr", "ast-twr-c", "loc-twr-c5", ["cold-work"],
            "Office partition reconfiguration on Tower C 5th floor", "completionPending", -30, 24, -54)
make_permit("fac-oml", "ast-oml-agc", "loc-oml-agc" if False else "loc-oml-flr", ["excavation"],
            "Excavation for new instrument cable trench near flare knockout drum", "fscCloseout", -50, 24, -72, contractor=True)
make_permit("fac-krpc", "ast-krpc-fcc", "loc-krpc-fcc", ["chemical-handling"],
            "Catalyst hopper cleaning and chemical transfer at FCC unit", "closed", -70, 24, -90, contractor=True)
make_permit("fac-phrc", "ast-phrc-pp", "loc-phrc-pp", ["electrical-work"],
            "Switchgear busbar torque verification at Power Plant", "closed", -90, 12, -110)

# ---- Adjust the ACTIVE OML gas test to be expiring soon (for expiry monitoring demo) ----
for g in gasTests:
    if g["permitId"] == "pmt-008":
        g["testedAt"] = iso(NOW - timedelta(hours=2))
        g["submittedAt"] = iso(NOW - timedelta(hours=2))
        g["approvedAt"] = iso(NOW - timedelta(hours=1, minutes=45))
        g["validUntil"] = iso(NOW + timedelta(hours=2))

# ---- Sub-gate records for the two permits sitting in fscOperationalReview ----
# pmt-003 (lift overhaul, isolation required) — job owner submitted LOTO, awaiting FSC approval
isolationCertificates.append({"id": "iso-sub-003", "permitId": "pmt-003", "type": "electrical",
                              "isolationPoints": "Lift A2 main breaker (DB-A-11), mainline switch locked & tagged",
                              "lotoVerified": True, "status": "submitted",
                              "submittedBy": "usr-001", "submittedAt": iso(NOW - timedelta(hours=2)),
                              "approvedBy": None, "approvedAt": None})
# pmt-004 (hot work at GHF, gas test required) — job owner entered gas test, awaiting FSC approval
gasTests.append({"id": "gas-sub-004", "permitId": "pmt-004",
                 "readings": {"o2": "20.9%", "lel": "0%", "h2s": "0 ppm", "co": "2 ppm", "other": "VOC: 0 ppm"},
                 "testedAt": iso(NOW - timedelta(hours=1)), "validUntil": iso(NOW + timedelta(hours=7)),
                 "status": "submitted", "submittedBy": "usr-001", "submittedAt": iso(NOW - timedelta(hours=1)),
                 "approvedBy": None, "approvedAt": None})

# ---- Monitoring events on active permits ----
monitoringEvents.append({"id": "mon-a01", "permitId": "pmt-007", "type": "Routine inspection",
                         "detail": "Toolbox talk verified, barricades intact, housekeeping good.",
                         "detectedAt": iso(NOW - timedelta(hours=3)), "resolvedAt": iso(NOW - timedelta(hours=3)),
                         "status": "resolved"})
monitoringEvents.append({"id": "mon-a02", "permitId": "pmt-008", "type": "Gas test expiry approaching",
                         "detail": "Gas test valid until " + iso(NOW + timedelta(hours=2)) + ". Retest before expiry.",
                         "detectedAt": iso(NOW - timedelta(minutes=30)), "resolvedAt": "", "status": "open"})

# ---- Notifications ----
notifications.extend([
    {"id": "ntf-001", "role": "FSC Owner", "permitId": "jsa-002",
     "message": "JSA-OML111-2026-002 (weld repair, Oredo Flow Station) awaits your review.",
     "read": False, "createdAt": iso(NOW - timedelta(hours=5))},
    {"id": "ntf-002", "role": "HSE Officer", "permitId": "jsa-003",
     "message": "JSA-TWR-2026-003 (Tower A roof work) awaits your endorsement.",
     "read": False, "createdAt": iso(NOW - timedelta(hours=4))},
    {"id": "ntf-003", "role": "Applicant", "permitId": "jsa-004",
     "message": "JSA-OML111-2026-004 approved — you may now raise the PTW for TK-01 inspection.",
     "read": False, "createdAt": iso(NOW - timedelta(hours=3))},
    {"id": "ntf-004", "role": "FSC Owner", "permitId": "pmt-003",
     "message": "PTW-TWR-2026-003: Isolation/LOTO submitted by job owner — approval required.",
     "read": False, "createdAt": iso(NOW - timedelta(hours=2))},
    {"id": "ntf-005", "role": "FSC Owner", "permitId": "pmt-004",
     "message": "PTW-OML111-2026-004: Gas test results submitted by job owner — approval required.",
     "read": False, "createdAt": iso(NOW - timedelta(hours=1))},
    {"id": "ntf-006", "role": "Contractor", "permitId": "pmt-005",
     "message": "PTW-TWR-2026-005 (B2 car park repainting) awaits your acceptance & signature.",
     "read": False, "createdAt": iso(NOW - timedelta(hours=6))},
    {"id": "ntf-007", "role": "Applicant", "permitId": "pmt-008",
     "message": "Gas test on PTW-OML111-2026-008 expires in ~2 hours — arrange retest.",
     "read": False, "createdAt": iso(NOW - timedelta(minutes=30))},
    {"id": "ntf-008", "role": "HSE Officer", "permitId": "pmt-002",
     "message": "PTW-OML111-2026-002 (manifold maintenance) submitted for HSE review.",
     "read": False, "createdAt": iso(NOW - timedelta(hours=2))},
])

db = {
    "users": users, "facilities": facilities, "assets": assets, "locations": locations,
    "workTypeRules": workTypeRules, "jsas": jsas, "jsaReviews": jsaReviews,
    "permits": permits, "documents": documents, "validationChecks": validationChecks,
    "hseReviews": hseReviews, "fscReviews": fscReviews, "simopsAssessments": simopsAssessments,
    "isolationCertificates": isolationCertificates, "gasTests": gasTests,
    "contractorAcceptances": contractorAcceptances, "finalApprovals": finalApprovals,
    "monitoringEvents": monitoringEvents, "revalidations": revalidations,
    "completions": completions, "siteVerifications": siteVerifications, "closeouts": closeouts,
    "auditTrail": auditTrail, "notifications": notifications,
}

out = "/Users/muhammadnuramuhammad/Downloads/Smart PTW/server/db.json"
with open(out, "w") as f:
    json.dump(db, f, indent=2)

print(f"users={len(users)} facilities={len(facilities)} assets={len(assets)} locations={len(locations)}")
print(f"rules={len(workTypeRules)} jsas={len(jsas)} permits={len(permits)} docs={len(documents)}")
print(f"gasTests={len(gasTests)} isoCerts={len(isolationCertificates)} notifications={len(notifications)}")
print("Permit statuses:", {p['id']: p['status'] for p in permits})
