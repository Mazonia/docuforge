export const DEMO_TEMPLATE = {
  filename: "Nova_Vanguard_Space_Ranger_Proposal.docx",
  filepath: "backend/samples/Nova_Vanguard_Space_Ranger_Proposal.docx",
  filesize: 37540,
  paragraph_count: 24,
  table_count: 2,
  word_count: 580,
  placeholders: [
    { raw: "[Ranger Unit Name]", key: "Ranger Unit Name", label: "Ranger Unit Name", type: "text", suggested: "Aegis Recon Squadron 9", occurrences: 3 },
    { raw: "[Rank and Last Name]", key: "Rank and Last Name", label: "Rank and Last Name", type: "text", suggested: "Commander Valeria Cross", occurrences: 2 },
    { raw: "[Specialization Division]", key: "Specialization Division", label: "Specialization Division", type: "text", suggested: "Deep Space Plasma Interception", occurrences: 1 },
    { raw: "[Assigned Star Sector]", key: "Assigned Star Sector", label: "Assigned Star Sector", type: "text", suggested: "Kepler Outpost Sector 4", occurrences: 1 },
    { raw: "[Vessel Class]", key: "Vessel Class", label: "Vessel Class", type: "text", suggested: "Vanguard Hyper-Cruiser MK-IV", occurrences: 1 },
    { raw: "[amount]", key: "amount", label: "Mission Bounty (Credits)", type: "number", suggested: "45,000", occurrences: 2 },
    { raw: "[X]", key: "X", label: "Logistics Fee (%)", type: "number", suggested: "6", occurrences: 1 },
    { raw: "[payout timing]", key: "payout timing", label: "Payout Window", type: "text", suggested: "24 hours", occurrences: 1 },
    { 
      raw: "[is fully subsidized by Galactic Council / carries an auxiliary warp-cell surcharge of [amount] Credits]", 
      key: "Fee & Subsidy Terms", 
      label: "Fee & Subsidy Terms", 
      type: "clause", 
      is_clause: true, 
      is_conditional: true, 
      suggested: "carries an auxiliary warp-cell surcharge of 45,000 Credits",
      occurrences: 1 
    },
    { 
      raw: "[deducts a spaceport logistics fee of [X]% from each completed mission payout]", 
      key: "Fee Rate Protocol", 
      label: "Fee Rate Protocol", 
      type: "clause", 
      is_clause: true, 
      suggested: "deducts a spaceport logistics fee of 6% from each completed mission payout",
      occurrences: 1 
    },
    { 
      raw: "[by quantum hyper-relay or sub-space credit transfer, within [payout timing] of debriefing approval]", 
      key: "Payout / Transfer Window", 
      label: "Payout / Transfer Window", 
      type: "clause", 
      is_clause: true, 
      suggested: "by quantum hyper-relay or sub-space credit transfer, within 24 hours of debriefing approval",
      occurrences: 1 
    },
    { raw: "[Signature]", key: "Signature", label: "Digital Signature", type: "signature", suggested: "", occurrences: 1 }
  ],
  sample_paragraphs: [
    { is_heading: true, text: "NOVA VANGUARD SPACE COMMAND — MISSION ASSIGNMENT PROPOSAL" },
    { is_heading: false, text: "This Official Directive is ratified between Nova Vanguard Command and [Rank and Last Name] representing [Ranger Unit Name]." },
    { is_heading: true, text: "1. DIVISIONAL DEPLOYMENT & SECTOR DESIGNATION" },
    { is_heading: false, text: "The unit is officially assigned to [Assigned Star Sector] operating under the [Specialization Division] wing with flagship vessel [Vessel Class]." },
    { is_heading: true, text: "2. BOUNTY ALLOCATION & FINANCIAL TERMS" },
    { is_heading: false, text: "Upon mission completion and debriefing approval, compensation of [amount] Credits shall be disbursed. Deployment [is fully subsidized by Galactic Council / carries an auxiliary warp-cell surcharge of [amount] Credits]." },
    { is_heading: false, text: "Orbital Command [deducts a spaceport logistics fee of [X]% from each completed mission payout] for fuel and shield maintenance." },
    { is_heading: false, text: "All bounties shall be transferred [by quantum hyper-relay or sub-space credit transfer, within [payout timing] of debriefing approval]." },
    { is_heading: true, text: "3. RATIFICATION & COMMAND SIGNATURE" },
    { is_heading: false, text: "Authorized Squadron Signature Anchor: [Signature]" }
  ]
};

