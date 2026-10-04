/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */


import type { Template } from "@/types/templates";
import {
  type FaqEntry,
  type IndexableTemplateId,
  isIndexableTemplate,
  templatePath,
  templatePreviewPath,
  templateOgImagePath,
  templateSearchName,
  templateSeoTitle,
  templateSeoDescription,
  breadcrumbJsonLd,
  faqPageJsonLd,
  TEMPLATES_PATH
} from "./seoContent";

export interface TemplateContent {
  seoTitle: string;
  seoDescription: string;
  heading: string;
  intro: string[];
  whenToUse: string[];
  branches: Array<{ name: string; guide: string }>;
  example: { scenario: string; points: string[] };
  tips: string[];
  faqs: FaqEntry[];
  related: string[];
  updated: string;
}

export const templateContent: Record<IndexableTemplateId, TemplateContent> = {
  "swot-analysis": {
    seoTitle: "Free SWOT Analysis Template (Mind Map) | Neuron Mapping",
    seoDescription:
      "Free SWOT analysis template as an editable mind map. Map strengths, weaknesses, opportunities and threats in your browser, with no signup.",
    heading: "SWOT Analysis Mind Map Template",
    intro: [
      "A SWOT analysis sorts everything you know about a business, product, project or career decision into four groups: Strengths and Weaknesses (internal factors you control) and Opportunities and Threats (external factors you don't). Laying them out side by side shows where you have an edge, where you are exposed, and which moves are worth making.",
      "This template gives you the four SWOT branches around a central topic, ready to fill in. Because it is a mind map rather than a fixed 2×2 grid, each quadrant can grow as deep as you need: add evidence under a point, connect related ideas, and color-code the items you plan to act on."
    ],
    whenToUse: [
      "Before a strategy or annual planning session",
      "Evaluating a new product, market or business idea",
      "Comparing your position with a competitor",
      "A personal SWOT for a career move or interview preparation"
    ],
    branches: [
      { name: "Strengths", guide: "Internal advantages: what you do better than others, unique resources, skills, brand or cost position. Ask what customers praise you for." },
      { name: "Weaknesses", guide: "Internal limitations: gaps in skills, funding, process or product. Be honest; this is the branch teams most often leave thin." },
      { name: "Opportunities", guide: "External trends you could use: market growth, new technology, regulation changes, gaps competitors leave, possible partnerships." },
      { name: "Threats", guide: "External risks: new competitors, price pressure, supply problems, changing customer habits, legal changes." }
    ],
    example: {
      scenario: "A small 3D-printing shop deciding whether to launch an online store",
      points: [
        "Strengths: fast turnaround, in-house design skills, loyal local customers",
        "Weaknesses: no e-commerce experience; one person handles every order",
        "Opportunities: growing demand for custom parts; marketplaces with built-in traffic",
        "Threats: cheap overseas print services; rising filament costs"
      ]
    },
    tips: [
      "Keep internal (S, W) and external (O, T) factors apart: a market trend is an opportunity or threat, not a strength.",
      "Write specific, evidence-backed points (\"40% of customers reorder\") instead of vague ones (\"good service\").",
      "Finish by pairing items: a strength that exploits an opportunity, or a strength that blunts a threat, becomes a concrete action.",
      "Limit each branch to the 3–5 most important points so the exported map stays readable."
    ],
    faqs: [
      { q: "What does SWOT stand for?", a: "Strengths, Weaknesses, Opportunities and Threats. Strengths and weaknesses are internal to the organization or project; opportunities and threats come from the external environment." },
      { q: "How is a SWOT mind map different from a SWOT matrix?", a: "A matrix fixes each factor in one of four boxes. A mind map keeps the same four categories but lets every point branch into sub-points, evidence and next actions, which makes it easier to go from analysis to a plan." },
      { q: "Can I export my SWOT analysis?", a: "Yes. Export the finished map as a PDF or high-resolution PNG for slides and reports, or save it as an .nmm file to keep editing later." }
    ],
    related: ["porters-five-forces", "business-model-canvas", "okr-planning", "decision-tree"],
    updated: "2026-10-03"
  },

  "business-model-canvas": {
    seoTitle: "Free Business Model Canvas Template | Neuron Mapping",
    seoDescription:
      "Free business model canvas template with all nine building blocks as an editable mind map. Plan partners, value propositions and revenue, with no signup.",
    heading: "Business Model Canvas Mind Map Template",
    intro: [
      "The Business Model Canvas, created by Alexander Osterwalder, describes how an organization creates, delivers and captures value using nine building blocks: customer segments, value propositions, channels, customer relationships, revenue streams, key resources, key activities, key partners and cost structure. It fits a whole business model on one page, which makes it a favorite for startups, product teams and innovation workshops.",
      "This template lays out all nine blocks as branches of a single map. Start with the customer side (segments, value propositions, channels, relationships, revenue), then fill in the infrastructure side (activities, resources, partners, costs) that makes it possible."
    ],
    whenToUse: [
      "Sketching a new startup or side-business idea",
      "Documenting how an existing business actually makes money",
      "Comparing alternative business models before choosing one",
      "Preparing for a pitch or investor conversation"
    ],
    branches: [
      { name: "Customer Segments", guide: "The distinct groups you serve. Be specific: \"freelance designers\", not \"everyone\"." },
      { name: "Value Propositions", guide: "The problem you solve or the gain you create for each segment, and why they would choose you." },
      { name: "Channels", guide: "How customers discover, buy and receive what you offer: website, marketplace, retail, a sales team." },
      { name: "Customer Relationships", guide: "The relationship each segment expects: self-service, community, personal support, subscription." },
      { name: "Revenue Streams", guide: "How each segment pays: one-off sales, subscriptions, licensing, usage fees, advertising." },
      { name: "Key Resources", guide: "The assets the model depends on: people, intellectual property, equipment, data, brand." },
      { name: "Key Activities", guide: "What you must do well to deliver the value proposition: production, platform development, problem solving." },
      { name: "Key Partners", guide: "Suppliers and partners who provide resources or activities you don't do yourself." },
      { name: "Cost Structure", guide: "The most important costs of running the model, and whether it is cost-driven or value-driven." }
    ],
    example: {
      scenario: "An open-source desktop app funded by donations and paid support",
      points: [
        "Customer Segments: individual makers; small teams that need support",
        "Value Propositions: a free, private, offline tool; guaranteed response times for teams",
        "Revenue Streams: donations, sponsorships, annual support contracts",
        "Cost Structure: developer time, code-signing certificates, download hosting"
      ]
    },
    tips: [
      "Fill the customer side first; the infrastructure only makes sense once you know who you serve and why.",
      "Give each customer segment its own color and reuse it in the other blocks to see which activities and costs serve which customers.",
      "Treat every note as a hypothesis to test, not a fact, especially for a new venture.",
      "Keep a copy of each version. Comparing canvases side by side shows how your model evolved."
    ],
    faqs: [
      { q: "What are the nine blocks of the Business Model Canvas?", a: "Customer Segments, Value Propositions, Channels, Customer Relationships, Revenue Streams, Key Resources, Key Activities, Key Partners and Cost Structure." },
      { q: "Is this the same as a Lean Canvas?", a: "They are related. The Lean Canvas replaces some blocks, such as Key Partners, with startup-focused ones like Problem, Solution and Unfair Advantage. You can rename the branches in this template to turn it into a Lean Canvas." }
    ],
    related: ["swot-analysis", "porters-five-forces", "customer-journey", "okr-planning"],
    updated: "2026-10-03"
  },

  "eisenhower-box": {
    seoTitle: "Free Eisenhower Matrix Template (Mind Map) | Neuron Mapping",
    seoDescription:
      "Free Eisenhower matrix template to prioritize tasks by urgency and importance: Do First, Schedule, Delegate, Eliminate. Editable online, no signup.",
    heading: "Eisenhower Matrix Mind Map Template",
    intro: [
      "The Eisenhower Matrix, also called the Eisenhower Box or urgent-important matrix, is a prioritization method named after US President Dwight D. Eisenhower. Every task is judged on two questions, whether it is urgent and whether it is important, which places it in one of four quadrants: Do First, Schedule, Delegate or Eliminate.",
      "This template gives you the four quadrants as branches, each labeled with its rule. Drop your to-do list into the map, move each task to the branch where it belongs, and you have a clear plan for the day or week."
    ],
    whenToUse: [
      "Your to-do list is longer than the time you have",
      "Planning a week or sprint and deciding what to drop",
      "Reviewing where your time actually goes",
      "Deciding which work to hand off to someone else"
    ],
    branches: [
      { name: "Do First", guide: "Urgent and important: deadlines today, real emergencies, problems that block others. Do these yourself, now." },
      { name: "Schedule", guide: "Important but not urgent: planning, learning, relationships, prevention. Put these on the calendar; this is where long-term progress happens." },
      { name: "Delegate", guide: "Urgent but not important to you: interruptions, many emails and meetings, routine requests. Hand them to someone else or batch them." },
      { name: "Eliminate", guide: "Neither urgent nor important: busywork and distractions. Delete them or consciously postpone them." }
    ],
    example: {
      scenario: "A freelancer's Monday task list",
      points: [
        "Do First: fix a client site outage; send the invoice due today",
        "Schedule: write a portfolio case study; learn a new CAD tool",
        "Delegate: format social media posts; book the courier pickup",
        "Eliminate: reorganize old folders; browse tool forums"
      ]
    },
    tips: [
      "Judge importance by your goals, not by who is asking the loudest.",
      "If Do First keeps overflowing, move more work into Schedule so it gets done before it becomes urgent.",
      "Review the map at the end of each day and move unfinished tasks instead of letting them pile up.",
      "Add due dates or owners as child nodes under each task."
    ],
    faqs: [
      { q: "What is the difference between urgent and important?", a: "Urgent tasks demand attention now, usually because of a deadline or someone waiting. Important tasks contribute to your long-term goals and values. Many urgent tasks are not important, and most important work is not urgent." },
      { q: "Is the Eisenhower Matrix the same as the Eisenhower Box?", a: "Yes. Eisenhower Matrix, Eisenhower Box, Eisenhower Decision Matrix and urgent-important matrix all describe the same four-quadrant method." }
    ],
    related: ["okr-planning", "decision-tree", "sprint-retrospective", "five-whys"],
    updated: "2026-10-03"
  },

  "cause-effect": {
    seoTitle: "Fishbone Diagram Template (Cause & Effect) | Neuron Mapping",
    seoDescription:
      "Free fishbone (Ishikawa) diagram template to trace a problem to its causes: equipment, materials, process, environment, people, management. Edit online.",
    heading: "Fishbone Diagram (Cause & Effect) Template",
    intro: [
      "A fishbone diagram, also called an Ishikawa or cause-and-effect diagram, is a root cause analysis tool developed by Kaoru Ishikawa for quality management. The problem sits at the head of the fish, and the bones are categories of possible causes. Working through each category stops a team from jumping to the first explanation and helps it see every factor that could contribute.",
      "This template starts with six common cause categories, Equipment, Materials, Process, Environment, People and Management, connected to a central problem. Rename or add categories to suit your field, then brainstorm specific causes under each one."
    ],
    whenToUse: [
      "A recurring defect, failure or complaint with no obvious cause",
      "Structured team brainstorming in a quality or incident review",
      "Investigating a production, service or software problem",
      "Choosing which likely cause to dig into with a 5 Whys analysis"
    ],
    branches: [
      { name: "Equipment", guide: "Machines, tools, hardware and software: calibration, wear, configuration, capacity." },
      { name: "Materials", guide: "Raw materials, parts, data or other inputs: quality, specifications, supplier variation." },
      { name: "Process", guide: "The method used: unclear procedures, missing steps, handoffs, steps done in the wrong order." },
      { name: "Environment", guide: "Conditions around the work: temperature, humidity, noise, workspace layout, time pressure." },
      { name: "People", guide: "Skills, training, workload, communication and staffing." },
      { name: "Management", guide: "Policies, targets, resourcing, supervision and decisions that shape the work." }
    ],
    example: {
      scenario: "3D prints failing with warped corners",
      points: [
        "Equipment: uneven print bed; worn nozzle",
        "Materials: damp filament; a new filament brand",
        "Process: first-layer settings changed last week",
        "Environment: cold draft near the printer",
        "People: new operator not yet trained on bed leveling"
      ]
    },
    tips: [
      "State the problem as something specific and measurable (\"12% of parts warp\"), not something vague.",
      "List possible causes first and judge them later; the value is in the breadth of the brainstorm.",
      "Mark causes you can verify with data in a different color, and test those first.",
      "Take the strongest candidate cause into a 5 Whys analysis to find its root."
    ],
    faqs: [
      { q: "What are the categories of a fishbone diagram?", a: "Manufacturing teams often use the 6 Ms: Machine, Method, Material, Man (people), Measurement and Mother Nature (environment). Service teams often use the 4 Ps or 4 Ss. This template uses Equipment, Materials, Process, Environment, People and Management, and you can rename any branch." },
      { q: "What is the difference between a fishbone diagram and 5 Whys?", a: "A fishbone diagram spreads wide to capture many possible causes across categories. 5 Whys goes deep on one chain of causes. They work well together: use the fishbone to find likely causes, then 5 Whys to dig into the most likely one." }
    ],
    related: ["five-whys", "decision-tree", "swot-analysis", "sprint-retrospective"],
    updated: "2026-10-03"
  },

  "five-whys": {
    seoTitle: "5 Whys Template for Root Cause Analysis | Neuron Mapping",
    seoDescription:
      "Free 5 Whys root cause analysis template. Start from a problem, ask why five times and reach the real root cause. Editable mind map, no signup.",
    heading: "5 Whys Root Cause Analysis Template",
    intro: [
      "The 5 Whys is a root cause analysis technique made popular by the Toyota Production System. You state a problem, ask why it happened, then ask why again about that answer, usually about five times, until you reach a cause that would stop the problem from coming back if you fixed it. It is quick, needs no statistics, and works for manufacturing defects, software incidents and everyday process problems.",
      "This template is a single chain from Problem through Why #1 to Why #4 and a Root Cause node. Because it is a mind map, you can branch any level when a question has more than one answer and follow each path separately."
    ],
    whenToUse: [
      "After an incident or outage, as part of a blameless post-mortem",
      "A problem keeps coming back even though it was \"fixed\"",
      "A customer complaint needs a real answer, not a workaround",
      "Following up the most likely cause from a fishbone diagram"
    ],
    branches: [
      { name: "Problem", guide: "A clear, factual statement of what went wrong, when, and how often." },
      { name: "Why? #1 to #4", guide: "Each answer explains the node above it. Base it on evidence such as logs, observations or data, not assumptions." },
      { name: "Root Cause", guide: "The point where the answer is a process or system cause you can change. Add a child node with the countermeasure." }
    ],
    example: {
      scenario: "Customer orders are shipping late",
      points: [
        "Why? Parcels missed the courier pickup.",
        "Why? Packing started after 4 pm.",
        "Why? Orders were only printed once a day.",
        "Why? Exporting orders is a manual step done by one person.",
        "Root cause: no automated order export. Countermeasure: schedule exports every hour."
      ]
    },
    tips: [
      "Stop when you reach a cause you can act on. Sometimes that takes three whys, sometimes seven.",
      "Focus on processes, not people: \"the checklist had no step for it\" leads to a fix, \"Sam forgot\" does not.",
      "Branch the map when a why has several valid answers instead of forcing a single chain.",
      "Record the countermeasure and an owner under the root cause so the analysis leads to action."
    ],
    faqs: [
      { q: "Do you always need exactly five whys?", a: "No. Five is a rule of thumb. Keep asking until you reach a cause you can fix that would prevent the problem from recurring, whether that takes three questions or seven." },
      { q: "What are the limitations of the 5 Whys?", a: "It depends on the knowledge of the people answering, and it can follow a single path when a problem has several causes. Branching the chain, checking each answer against evidence, and combining it with a fishbone diagram reduce those risks." }
    ],
    related: ["cause-effect", "decision-tree", "sprint-retrospective", "eisenhower-box"],
    updated: "2026-10-03"
  },

  "decision-tree": {
    seoTitle: "Free Decision Tree Template (Mind Map) | Neuron Mapping",
    seoDescription:
      "Free decision tree template to map a choice, its yes/no branches and outcomes. Compare options and export to PDF online, with no signup.",
    heading: "Decision Tree Mind Map Template",
    intro: [
      "A decision tree lays out a choice as a branching diagram: a decision at the root, the options or yes/no answers as branches, and the resulting outcomes at the ends. Seeing every path at once makes it easier to compare consequences, spot missing options and explain your reasoning to others.",
      "This template starts with one decision, a Yes and a No branch, and two outcomes under each. Extend it with further questions, add costs, probabilities or notes to each outcome, and use colors to highlight the path you choose."
    ],
    whenToUse: [
      "Choosing between options with different consequences",
      "Documenting troubleshooting steps or support scripts",
      "Explaining a policy or eligibility rule as a series of questions",
      "Comparing risks and payoffs before a business or project decision"
    ],
    branches: [
      { name: "Decision?", guide: "The question to answer, written so it has clear answers (yes/no or a set of options)." },
      { name: "Yes / No", guide: "Each branch is one answer or option. Add more branches if there are more than two choices." },
      { name: "Outcome A to D", guide: "The result of following that path. Add details such as cost, time, risk or probability as child nodes." }
    ],
    example: {
      scenario: "Should we build a feature in-house?",
      points: [
        "Yes, Outcome A: full control, but 8 weeks of developer time",
        "Yes, Outcome B: the mobile release is delayed",
        "No, Outcome C: buy a plugin for $300 a year",
        "No, Outcome D: limited customization, but available this week"
      ]
    },
    tips: [
      "Keep each question to a single decision so every branch is unambiguous.",
      "Put numbers on outcomes (cost, time, probability) where you can; they make branches comparable.",
      "Prune branches that are clearly unacceptable to keep the tree readable.",
      "Highlight the chosen path in a strong color before you export it for stakeholders."
    ],
    faqs: [
      { q: "What is a decision tree used for?", a: "Decision trees are used to compare options and their consequences, document troubleshooting or approval flows, and explain rules as a series of questions. In analytics they are also used to model probabilities and expected values." },
      { q: "What is the difference between a decision tree and a flowchart?", a: "A flowchart describes the steps of a process in order. A decision tree focuses on a choice and the outcome of each option. Many diagrams mix both; this template is designed for comparing outcomes." }
    ],
    related: ["simple-flowchart", "five-whys", "eisenhower-box", "swot-analysis"],
    updated: "2026-10-03"
  },

  "okr-planning": {
    seoTitle: "OKR Template (Objectives & Key Results) | Neuron Mapping",
    seoDescription:
      "Free OKR planning template: one objective, three measurable key results and the initiatives behind them. Editable mind map for teams, with no signup.",
    heading: "OKR Planning Mind Map Template",
    intro: [
      "OKRs, short for Objectives and Key Results, are a goal-setting framework popularized by Intel and Google. An objective describes what you want to achieve in qualitative, motivating terms. Key results are the measurable outcomes that show whether you got there. Initiatives are the projects and tasks you do to move the key results.",
      "This template maps one objective to three key results, each with two supporting initiatives. The hierarchy makes it easy to check that every initiative drives a key result and every key result proves progress on the objective."
    ],
    whenToUse: [
      "Quarterly or annual goal setting for a team or company",
      "Aligning a team's projects with a larger company objective",
      "Turning a vague ambition into measurable targets",
      "Personal goals, such as a learning or fitness plan"
    ],
    branches: [
      { name: "Objective", guide: "One ambitious, qualitative goal for the period, such as \"Make onboarding effortless for new users\"." },
      { name: "Key Result 1 to 3", guide: "Measurable outcomes with a baseline and a target, such as \"Raise day-7 retention from 20% to 35%\". Three to five per objective." },
      { name: "Initiatives", guide: "The projects or experiments you expect to move the key result. They can change during the quarter; the key results should not." }
    ],
    example: {
      scenario: "A product team's quarterly OKR",
      points: [
        "Objective: make first-time mind mapping effortless",
        "KR1: 60% of new users create a map within 5 minutes (up from 35%)",
        "KR2: halve template-related support emails",
        "KR3: reach a 4.5/5 onboarding survey score",
        "Initiatives: a guided first map, template previews, in-app shortcut tips"
      ]
    },
    tips: [
      "Write key results as outcomes, not tasks. \"Launch the tutorial\" is an initiative; \"70% tutorial completion\" is a key result.",
      "Keep to one to three objectives per team per quarter so the focus is real.",
      "Add the current value and the target as child nodes under each key result, and update them weekly.",
      "Score each key result at the end of the period and carry the lessons into the next map."
    ],
    faqs: [
      { q: "What is the difference between a key result and an initiative?", a: "A key result is a measurable outcome that shows progress toward the objective. An initiative is the work you do to try to move that number. If the initiative is finished but the key result hasn't moved, the objective hasn't been achieved." },
      { q: "How many key results should an objective have?", a: "Usually three to five. Fewer can miss important parts of the objective; more dilutes focus. This template starts with three." }
    ],
    related: ["eisenhower-box", "swot-analysis", "sprint-retrospective", "business-model-canvas"],
    updated: "2026-10-03"
  },

  "customer-journey": {
    seoTitle: "Free Customer Journey Map Template | Neuron Mapping",
    seoDescription:
      "Free customer journey map template covering awareness, consideration, purchase, retention and advocacy touchpoints. Edit as a mind map, with no signup.",
    heading: "Customer Journey Map Template",
    intro: [
      "A customer journey map shows the stages a person goes through with your product or service, from first hearing about it to recommending it to others. For each stage it captures the touchpoints where the customer interacts with you, and it can also record what they are trying to do, how they feel, and where they get stuck.",
      "This template follows a five-stage model, Awareness, Consideration, Purchase, Retention and Advocacy, with example touchpoints under each stage. Replace them with your own channels and add pain points and ideas as child nodes to turn the map into an improvement plan."
    ],
    whenToUse: [
      "Finding where customers drop off or get frustrated",
      "Aligning marketing, sales, product and support around one view of the customer",
      "Designing a new service or onboarding flow",
      "Prioritizing customer experience improvements"
    ],
    branches: [
      { name: "Awareness", guide: "How people first discover you: ads, social media, search, word of mouth." },
      { name: "Consideration", guide: "How they compare you with alternatives: reviews, demos, comparisons, pricing pages." },
      { name: "Purchase", guide: "The moment they buy or sign up: checkout, contracts, payment, first delivery." },
      { name: "Retention", guide: "What keeps them using you: onboarding, support, updates, ongoing value." },
      { name: "Advocacy", guide: "What turns customers into promoters: referrals, reviews, community, case studies." }
    ],
    example: {
      scenario: "An online shop selling custom 3D-printed parts",
      points: [
        "Awareness: maker forums, YouTube build videos",
        "Consideration: sample photos, a material guide, an instant quote tool",
        "Purchase: file upload and checkout. Pain point: shipping cost is shown too late",
        "Retention: order tracking, a reorder button",
        "Advocacy: photo reviews, a referral discount"
      ]
    },
    tips: [
      "Map the journey for one specific persona at a time; different customers take different routes.",
      "Base the map on real data such as interviews, analytics and support tickets rather than assumptions.",
      "Mark pain points in red and opportunities in green so the priorities stand out.",
      "Pair it with an empathy map to capture what the customer thinks and feels at each stage."
    ],
    faqs: [
      { q: "What are the stages of a customer journey map?", a: "A common model uses Awareness, Consideration, Purchase, Retention and Advocacy. Some teams add Onboarding or split Purchase into Decision and Purchase. Rename or add stage branches to match your business." },
      { q: "What is a touchpoint?", a: "Any point where a customer interacts with your brand: an ad, a web page, an email, a checkout, a support call or a review site." }
    ],
    related: ["empathy-map", "business-model-canvas", "swot-analysis", "okr-planning"],
    updated: "2026-10-03"
  },

  "empathy-map": {
    seoTitle: "Free Empathy Map Template for UX | Neuron Mapping",
    seoDescription:
      "Free empathy map template for UX and design thinking. Capture what your user says, thinks, does and feels in an editable mind map, with no signup.",
    heading: "Empathy Map Template",
    intro: [
      "An empathy map is a design-thinking tool for building a shared understanding of a user. It sorts what you have learned about a person into four quadrants, what they Say, Think, Do and Feel, so a team can see past surface requests to the needs and motivations underneath. It was popularized by Dave Gray and is widely used in UX research and product design.",
      "This template puts the user at the center with the four quadrants as branches. Fill it from interviews, observation and support conversations, then look for contradictions between what people say and what they do. That is often where the best insights are."
    ],
    whenToUse: [
      "Synthesizing user interviews or usability tests",
      "Kicking off a design sprint or product discovery",
      "Building or validating a persona",
      "Helping a team agree on who it is designing for"
    ],
    branches: [
      { name: "Says", guide: "Direct quotes from interviews and feedback: what the user says out loud about the problem." },
      { name: "Thinks", guide: "What occupies their mind but may go unsaid: worries, beliefs, priorities." },
      { name: "Does", guide: "Observed behavior: actions, workarounds, habits and the tools they use." },
      { name: "Feels", guide: "Emotions: frustrations, anxieties, what excites them, how they feel about their current solution." }
    ],
    example: {
      scenario: "A student preparing for exams",
      points: [
        "Says: \"I just need one place for all my notes.\"",
        "Thinks: worries about studying the wrong topics",
        "Does: copies notes between three apps; makes lists late at night",
        "Feels: overwhelmed before exams, relieved once topics are organized"
      ]
    },
    tips: [
      "Use real quotes and observations. An empathy map built on assumptions only confirms what you already believe.",
      "Make one map per user or persona rather than averaging different people together.",
      "Add Pains and Gains branches if you want the extended version of the empathy map.",
      "Look for contradictions between Says and Does; they often reveal unmet needs."
    ],
    faqs: [
      { q: "What are the four quadrants of an empathy map?", a: "Says, Thinks, Does and Feels. Extended versions add Pains and Gains, or Sees and Hears. You can add these as extra branches in this template." },
      { q: "What is the difference between an empathy map and a customer journey map?", a: "An empathy map describes a user's mindset at one point in time. A customer journey map describes the steps they take over time. They work well together." }
    ],
    related: ["customer-journey", "business-model-canvas", "swot-analysis", "five-whys"],
    updated: "2026-10-03"
  },

  "porters-five-forces": {
    seoTitle: "Free Porter's Five Forces Template | Neuron Mapping",
    seoDescription:
      "Free Porter's Five Forces template for industry and competitive analysis: rivalry, new entrants, substitutes, buyer and supplier power. Edit online.",
    heading: "Porter's Five Forces Mind Map Template",
    intro: [
      "Porter's Five Forces is a framework for analyzing the competitive structure of an industry, introduced by Harvard professor Michael E. Porter in 1979. It looks at five forces that shape how profitable a market can be: competitive rivalry, the threat of new entrants, the threat of substitutes, the bargaining power of buyers, and the bargaining power of suppliers.",
      "This template puts competitive rivalry at the center with the other four forces around it, each with a starting factor to assess: barriers to entry, switching costs, buyer volume and supplier uniqueness. Add evidence under each force and rate it high, medium or low to see where the pressure on your business comes from."
    ],
    whenToUse: [
      "Assessing whether a market is attractive before entering it",
      "Strategy work and business school case analysis",
      "Explaining why margins in an industry are high or low",
      "Adding an industry-level view to a SWOT analysis"
    ],
    branches: [
      { name: "Rivalry", guide: "Competition between existing players: number of competitors, industry growth, differentiation, price wars." },
      { name: "New Entrants", guide: "How easily new competitors can enter. Barriers include capital needs, regulation, brand loyalty and economies of scale." },
      { name: "Substitutes", guide: "Different products that meet the same need, and how cheap it is for customers to switch to them." },
      { name: "Buyers", guide: "Customer bargaining power: purchase volume, price sensitivity, concentration, ability to switch." },
      { name: "Suppliers", guide: "Supplier bargaining power: how unique their inputs are, how many alternatives exist, switching costs." }
    ],
    example: {
      scenario: "The consumer 3D-printer filament market",
      points: [
        "Rivalry: high, with many brands competing on price",
        "New Entrants: medium; little capital is needed, but brand trust matters",
        "Substitutes: low; there are few alternatives for FDM printing",
        "Buyers: high; prices are easy to compare online",
        "Suppliers: medium; there are a limited number of polymer producers"
      ]
    },
    tips: [
      "Analyze the industry, not your company; the forces apply to every player in the market.",
      "Rate each force high, medium or low and color it to match, so you see the overall picture at a glance.",
      "Support each rating with evidence such as market data, pricing or the number of suppliers.",
      "Revisit the analysis when technology or regulation changes; the forces shift over time."
    ],
    faqs: [
      { q: "What are Porter's Five Forces?", a: "Competitive rivalry, the threat of new entrants, the threat of substitute products or services, the bargaining power of buyers, and the bargaining power of suppliers." },
      { q: "What is the difference between Porter's Five Forces and SWOT?", a: "Five Forces analyzes the structure of a whole industry. SWOT looks at one organization's internal strengths and weaknesses alongside external opportunities and threats. A Five Forces analysis is a good input for the Opportunities and Threats branches of a SWOT." }
    ],
    related: ["swot-analysis", "business-model-canvas", "customer-journey", "decision-tree"],
    updated: "2026-10-03"
  },

  "org-chart": {
    seoTitle: "Free Org Chart Template (Mind Map) | Neuron Mapping",
    seoDescription:
      "Free org chart template showing a reporting hierarchy from CEO to VPs, managers and teams. Edit roles online and export to PDF or PNG, with no signup.",
    heading: "Org Chart Mind Map Template",
    intro: [
      "An organizational chart shows who reports to whom. It makes roles, responsibilities and lines of authority visible, which helps new hires find their way, shows managers where teams are over- or under-staffed, and supports planning for growth or restructuring.",
      "This template is a three-level hierarchy: a CEO, three vice presidents (Engineering, Sales and Operations), and two roles under each. Rename the boxes, add or remove levels, and use colors to show departments, open positions or locations."
    ],
    whenToUse: [
      "Onboarding new employees and showing who does what",
      "Planning hires, reorganizations or a new team structure",
      "Documenting a small business or startup as it grows",
      "Club, school or volunteer organization structures"
    ],
    branches: [
      { name: "CEO", guide: "The top of the hierarchy: the person or board everyone ultimately reports to." },
      { name: "VP Engineering, Sales, Operations", guide: "Department heads. Rename them to match your own functions, such as Marketing, Finance or Product." },
      { name: "Managers and leads", guide: "Team-level roles under each department. Add people's names as child nodes, or mark open positions in a different color." }
    ],
    example: {
      scenario: "A 15-person hardware startup",
      points: [
        "CEO: the founder",
        "VP Engineering: firmware lead, mechanical lead, QA",
        "VP Sales: account executive, marketplace manager",
        "VP Operations: production manager, support lead, and an open logistics coordinator role"
      ]
    },
    tips: [
      "Show roles first and add names as child nodes, so the chart survives staff changes.",
      "Use one color per department and a distinct color for open positions.",
      "Include only the levels your audience needs, and make separate maps for large departments.",
      "Add responsibilities or contact details to each role's notes for an onboarding-ready chart."
    ],
    faqs: [
      { q: "What types of org charts are there?", a: "The most common are hierarchical (top-down reporting lines, as in this template), functional (grouped by department), matrix (people report to both a function and a project), and flat structures. You can adapt this map to any of them." },
      { q: "Can I use this template for a family tree or a club structure?", a: "Yes. Any hierarchy works: rename the root and branches to fit a family tree, a school class or a club committee." }
    ],
    related: ["employee-onboarding", "okr-planning", "swot-analysis", "business-model-canvas"],
    updated: "2026-10-03"
  },

  "sprint-retrospective": {
    seoTitle: "Free Sprint Retrospective Template | Neuron Mapping",
    seoDescription:
      "Free sprint retrospective template using the Start, Stop, Continue format. Run agile retros, capture action items and export the result, with no signup.",
    heading: "Sprint Retrospective Template (Start, Stop, Continue)",
    intro: [
      "A sprint retrospective is the Scrum meeting at the end of each sprint where the team looks at how it worked and agrees on improvements for the next one. Start, Stop, Continue is one of the simplest and most popular retro formats: the team lists what it should start doing, what it should stop doing, and what is working well and should continue.",
      "This template gives you the three branches with example items under each. Collect ideas from everyone, group similar ones, then pick one or two to commit to as action items for the next sprint."
    ],
    whenToUse: [
      "End-of-sprint retrospectives for Scrum and agile teams",
      "Project or release post-mortems",
      "Quick team health checks after a busy period",
      "Personal weekly reviews"
    ],
    branches: [
      { name: "Start", guide: "New practices, tools or habits the team wants to try in the next sprint." },
      { name: "Continue", guide: "What worked well and should be kept, so good practices aren't lost." },
      { name: "Stop", guide: "Things that waste time, cause friction, or no longer add value." }
    ],
    example: {
      scenario: "A web team after a two-week sprint",
      points: [
        "Start: pair up on complex tickets; write acceptance criteria before estimating",
        "Continue: 15-minute stand-ups; code reviews within a day",
        "Stop: adding work mid-sprint without re-planning; meetings without an agenda",
        "Action items: the Product Owner guards sprint scope; the team lead adds an agenda template"
      ]
    },
    tips: [
      "Have everyone add items silently first so the loudest voices don't dominate.",
      "Group duplicates, then vote on the one or two most valuable changes.",
      "Turn each chosen item into an action with an owner, and check it at the next retro.",
      "Keep past retro maps so you can see whether improvements actually stuck."
    ],
    faqs: [
      { q: "What is the Start, Stop, Continue retrospective format?", a: "A retrospective format where the team lists what it should start doing, what it should stop doing, and what it should continue doing. It is quick to run and focuses directly on changes in behavior." },
      { q: "What other retrospective formats are there?", a: "Popular alternatives include Mad, Sad, Glad; the 4Ls (Liked, Learned, Lacked, Longed for); and the Sailboat retro. Rename the branches in this template to use any of them." }
    ],
    related: ["kanban-board", "okr-planning", "five-whys", "eisenhower-box"],
    updated: "2026-10-03"
  },

  "compliance-checklist": {
    seoTitle: "Free Compliance Checklist Template | Neuron Mapping",
    seoDescription:
      "Free compliance review checklist template covering data privacy (GDPR/CCPA), contracts, regulatory standards and employment law. Editable online.",
    heading: "Compliance Review Checklist Template",
    intro: [
      "A compliance review checks that an organization meets its legal, regulatory and contractual obligations before problems turn into fines, disputes or lost customers. Splitting the review into areas makes sure nothing is missed and makes it clear who is responsible for each part.",
      "This template organizes a review into four areas, Data Privacy, Contracts, Regulatory and Employment, each with a starting checkpoint. Expand each branch into the specific checks that apply to your business, and use colors to track status as items are reviewed."
    ],
    whenToUse: [
      "Annual or quarterly internal compliance reviews",
      "Preparing for an audit, certification or due diligence",
      "Onboarding a new vendor or launching in a new market",
      "Small businesses setting up a first compliance program"
    ],
    branches: [
      { name: "Data Privacy", guide: "How personal data is collected, stored and shared: GDPR and CCPA obligations, privacy notices, consent, data subject requests, breach procedures." },
      { name: "Contracts", guide: "Customer and vendor agreements: renewal dates, data processing agreements, liability terms, and obligations you have committed to." },
      { name: "Regulatory", guide: "Industry-specific rules and standards, such as product safety, financial, health or environmental regulations, and certifications like ISO 27001." },
      { name: "Employment", guide: "Labor law and HR obligations: contracts, working hours, pay, health and safety, workplace policies." }
    ],
    example: {
      scenario: "A small online store selling in the EU and US",
      points: [
        "Data Privacy: update cookie consent; document how customer data is deleted on request",
        "Contracts: sign a data processing agreement with the email provider",
        "Regulatory: check product safety labeling for EU markets",
        "Employment: review contractor agreements for part-time packers"
      ]
    },
    tips: [
      "Add an owner and a due date to each checkpoint as child nodes.",
      "Use colors for status, for example green for compliant, amber for in progress and red for gaps.",
      "Keep evidence such as policy links and document names in node notes, so the map doubles as an audit trail.",
      "This template is an organizing tool, not legal advice. Confirm the requirements for your jurisdiction with a qualified professional."
    ],
    faqs: [
      { q: "What should a compliance checklist include?", a: "At minimum: data protection and privacy, contracts and vendor obligations, industry regulations and standards, and employment law. Many organizations add information security, financial controls, and health and safety." },
      { q: "Does this template make my business GDPR compliant?", a: "No template can do that on its own. It helps you organize and track the review; the actual requirements depend on your business and jurisdiction, so confirm them with a legal professional." }
    ],
    related: ["swot-analysis", "org-chart", "decision-tree", "five-whys"],
    updated: "2026-10-03"
  },

  "kanban-board": {
    seoTitle: "Free Kanban Board Template (Mind Map) | Neuron Mapping",
    seoDescription:
      "Free kanban board template with To Do, In Progress and Done columns. Plan tasks, limit work in progress and track flow visually, with no signup.",
    heading: "Kanban Board Template",
    intro: [
      "Kanban is a visual method for managing work as it moves through stages. It grew out of the Toyota Production System and was adapted for knowledge work by David J. Anderson. Every task is a card, every stage is a column, and cards move from left to right as work progresses, so anyone can see at a glance what is waiting, what is being worked on and what is finished.",
      "This template gives you the three classic columns, To Do, In Progress and Done, as branches with example tasks under each. Rename the columns to match your own workflow, add a Review or Blocked stage if you need one, and move task nodes between branches as their status changes."
    ],
    whenToUse: [
      "Managing a personal or team to-do list visually",
      "Running a software, content or design workflow with continuous delivery",
      "Spotting bottlenecks where work piles up",
      "Keeping stakeholders informed without status meetings"
    ],
    branches: [
      { name: "To Do", guide: "Work that is ready to start, ordered with the most important item first. Keep it short enough that everything in it is still relevant." },
      { name: "In Progress", guide: "Tasks someone is actively working on. Limit how many items can sit here at once (a WIP limit) so work gets finished instead of just started." },
      { name: "Done", guide: "Completed tasks. Keeping them visible for a while shows progress and helps in reviews and retrospectives." }
    ],
    example: {
      scenario: "A small team launching a website",
      points: [
        "To Do: write the About page, choose a hosting plan, prepare the launch email",
        "In Progress: build the contact form (Priya); edit product photos (Sam)",
        "Done: domain registered, style guide agreed",
        "WIP limit: no more than two items per person in progress"
      ]
    },
    tips: [
      "Set a work-in-progress limit for each column and respect it; it is the core of kanban.",
      "Add a Blocked or Waiting branch so stuck work is visible instead of hiding in In Progress.",
      "Put an owner and a due date as child nodes under each task.",
      "Review the board regularly and clear out old Done items so the map stays readable."
    ],
    faqs: [
      { q: "What is the difference between kanban and Scrum?", a: "Scrum works in fixed-length sprints with planned scope and defined roles. Kanban is continuous: work is pulled in whenever capacity frees up, and flow is controlled by work-in-progress limits rather than sprint boundaries. Many teams combine elements of both." },
      { q: "What is a WIP limit?", a: "A work-in-progress limit caps how many items can be in a column at once. When the limit is reached, the team finishes existing work before starting something new, which shortens delivery times and exposes bottlenecks." }
    ],
    related: ["sprint-retrospective", "okr-planning", "eisenhower-box", "product-launch-checklist"],
    updated: "2026-10-03"
  },

  "blank-mindmap": {
    seoTitle: "Free Blank Mind Map Template | Neuron Mapping",
    seoDescription:
      "Free blank mind map template: a central idea with four branches, ready to fill in. Brainstorm, plan or take notes online, with no signup.",
    heading: "Blank Mind Map Template",
    intro: [
      "A mind map organizes ideas around one central topic. Main themes branch out from the center, and each theme branches again into details, which mirrors the way people naturally connect ideas. The technique was popularized by Tony Buzan in the 1970s and is widely used for brainstorming, note-taking, studying and planning.",
      "This blank template gives you a central idea with four empty topics, so you can start mapping straight away. Rename the center, add as many branches and sub-branches as you need, and use colors and icons to group related ideas."
    ],
    whenToUse: [
      "Brainstorming ideas for a project, essay or business",
      "Taking or revising study notes",
      "Planning an event, a trip or a piece of writing",
      "Breaking a big goal into smaller parts"
    ],
    branches: [
      { name: "Central Idea", guide: "The main topic, question or goal, in a few words. Everything else on the map should relate to it." },
      { name: "Topic 1 to 4", guide: "The main themes or categories. Use single keywords or short phrases, then add sub-branches for details, examples and open questions." }
    ],
    example: {
      scenario: "Planning a science fair project",
      points: [
        "Central idea: how does temperature affect plant growth?",
        "Research: articles, similar experiments",
        "Materials: seeds, pots, thermometers",
        "Method: three temperature groups, daily measurements",
        "Presentation: charts, photos, conclusion"
      ]
    },
    tips: [
      "Write keywords rather than full sentences so the map stays easy to scan.",
      "Work outward from the center, and don't judge ideas while you are still brainstorming.",
      "Give each main branch its own color so groups are easy to see.",
      "When you finish, look for links between branches; they often lead to the best insights."
    ],
    faqs: [
      { q: "How do you make a mind map?", a: "Write the main topic in the center, add a branch for each main idea, then add smaller branches for details. Keep labels short, use colors for groups, and keep adding branches until the topic is covered." },
      { q: "What is the difference between a mind map and a concept map?", a: "A mind map radiates from one central topic in a hierarchy. A concept map can have several central ideas and labels the links between them to explain how the concepts relate." }
    ],
    related: ["swot-analysis", "six-thinking-hats", "venn-diagram", "simple-timeline"],
    updated: "2026-10-03"
  },

  "simple-flowchart": {
    seoTitle: "Free Flowchart Template (Online, No Signup) | Neuron Mapping",
    seoDescription:
      "Free simple flowchart template with a start, a decision and yes/no paths. Map a process or rule online, then export it as PDF or PNG, with no signup.",
    heading: "Simple Flowchart Template",
    intro: [
      "A flowchart shows the steps of a process in order, with arrows connecting each step to the next. Flowcharts use a few basic elements: start and end points, process steps, and decision points where the flow splits depending on a yes or no answer. They are one of the quickest ways to explain how something works or to spot where a process goes wrong.",
      "This template is the smallest useful flowchart: a Start node, one Decision, a Yes path and a No path, each leading to an End. Add process steps between them, chain more decisions, and rename the paths to describe what actually happens."
    ],
    whenToUse: [
      "Documenting a process so someone else can follow it",
      "Explaining a rule or policy that has conditions",
      "Planning the logic of a program, form or automation",
      "Finding redundant steps or bottlenecks in a workflow"
    ],
    branches: [
      { name: "Start", guide: "Where the process begins, usually a trigger such as \"Order received\" or \"Customer calls\"." },
      { name: "Decision?", guide: "A question with clear answers, such as \"Is the item in stock?\". Each answer becomes its own path." },
      { name: "Yes Path / No Path", guide: "The steps that follow each answer. Add process nodes here, and more decisions if a path splits again." },
      { name: "End", guide: "Where each path finishes. Different ends can describe different outcomes, such as \"Shipped\" or \"Back-ordered\"." }
    ],
    example: {
      scenario: "Handling a customer refund request",
      points: [
        "Start: refund request received",
        "Decision: was the purchase made less than 30 days ago?",
        "Yes path: approve the refund and send a confirmation email. End: refund issued",
        "No path: offer store credit. End: request closed"
      ]
    },
    tips: [
      "Keep each node to one action or question, written as a short verb phrase.",
      "Make sure every decision has an answer for every case, so no path dead-ends.",
      "Keep the main flow running top to bottom or left to right so it reads naturally.",
      "When a flowchart gets large, move sub-processes into their own maps."
    ],
    faqs: [
      { q: "What are the basic flowchart symbols?", a: "Ovals for start and end points, rectangles for process steps, diamonds for decisions, and arrows for the flow between them. In a mind map, node colors can play the role of shapes, for example one color for all decisions." },
      { q: "What is the difference between a flowchart and a decision tree?", a: "A flowchart describes the sequence of steps in a process, and its paths can loop or merge. A decision tree focuses on a choice and branches out to compare the outcome of each option." }
    ],
    related: ["decision-tree", "five-whys", "simple-timeline", "kanban-board"],
    updated: "2026-10-03"
  },

  "simple-timeline": {
    seoTitle: "Free Timeline Template (Mind Map) | Neuron Mapping",
    seoDescription:
      "Free timeline template for milestones, project schedules, history and study notes. Lay out events in order, then edit online or export, with no signup.",
    heading: "Timeline Template",
    intro: [
      "A timeline places events in chronological order so you can see what happens when, how long the gaps are, and how one step leads to the next. Timelines are used for project schedules and roadmaps, for history and study notes, and for telling the story of a company, a product or a person.",
      "This template is a chain of four milestones, each following the previous one. Rename each milestone with a date and a short label, add details such as owners or deliverables as child nodes, and extend the chain for as many stages as you need."
    ],
    whenToUse: [
      "Planning project phases and milestones",
      "Building a product roadmap to share with a team",
      "Summarizing historical events for study or teaching",
      "Showing a company's or a person's story in order"
    ],
    branches: [
      { name: "Timeline", guide: "The root: the subject or project the timeline covers, with its overall time span." },
      { name: "Milestone 1 to 4", guide: "Events or phases in order. Start each label with the date or period (\"Q1 2027\", \"1969\") and keep the description short; put details in child nodes." }
    ],
    example: {
      scenario: "A four-month plan to launch a small online course",
      points: [
        "Month 1: outline the course and record a sample lesson",
        "Month 2: record all lessons and write the worksheets",
        "Month 3: build the course page and invite beta students",
        "Month 4: act on feedback, launch publicly and announce it"
      ]
    },
    tips: [
      "Use the same date format on every milestone.",
      "Mark fixed deadlines in a different color from flexible target dates.",
      "Note dependencies, so it is clear which milestone must finish first.",
      "For long projects, keep one high-level timeline and make a more detailed map for each phase."
    ],
    faqs: [
      { q: "What should a project timeline include?", a: "At minimum: the major phases or milestones, their dates, and who is responsible for each. Many timelines also show dependencies between tasks and the key deliverables for each milestone." },
      { q: "What is the difference between a timeline and a Gantt chart?", a: "A timeline shows events or milestones in order. A Gantt chart also shows how long each task takes and how tasks overlap, which makes it better for detailed scheduling. A timeline is easier to read for overviews and presentations." }
    ],
    related: ["product-launch-checklist", "okr-planning", "kanban-board", "simple-flowchart"],
    updated: "2026-10-03"
  },

  "venn-diagram": {
    seoTitle: "Free Venn Diagram Template (Mind Map) | Neuron Mapping",
    seoDescription:
      "Free Venn diagram template to compare two things: what is unique to each and what they share. Edit online as a mind map and export to PDF or PNG.",
    heading: "Venn Diagram Template",
    intro: [
      "A Venn diagram compares sets by showing what each has on its own and what they have in common. It is named after the English logician John Venn, who introduced it in 1880. Two overlapping circles are the classic form: the outer parts hold what is unique to each item, and the overlap holds what they share.",
      "This template turns the diagram into an editable map with three branches: Set A, Set B and their Intersection. Listing items as nodes, instead of squeezing text into overlapping circles, leaves room for as many points as you need and keeps the comparison readable when you export it."
    ],
    whenToUse: [
      "Comparing two products, tools, ideas or candidates",
      "Compare-and-contrast exercises in school and study notes",
      "Finding common ground between two teams, audiences or proposals",
      "Checking where two customer segments overlap"
    ],
    branches: [
      { name: "Set A", guide: "Everything that is true of the first item but not the second. Rename the branch to the item's name." },
      { name: "Set B", guide: "Everything that is true of the second item but not the first." },
      { name: "Intersection", guide: "Characteristics both items share. This is often the most useful branch for finding common ground." }
    ],
    example: {
      scenario: "Comparing working from home with working in an office",
      points: [
        "Home only: no commute, flexible hours, fewer interruptions",
        "Office only: face-to-face collaboration, a clear separation from home life",
        "Shared: the same tasks, deadlines and team goals"
      ]
    },
    tips: [
      "Compare items at the same level, for example two tools rather than a tool and a company.",
      "Check each point: if it applies to both items, move it to the Intersection.",
      "For three items, add a Set C branch and a branch for each pair's overlap.",
      "Finish with a conclusion node that says what the comparison means for your decision."
    ],
    faqs: [
      { q: "What is the middle of a Venn diagram called?", a: "The overlapping area is called the intersection. It contains the elements that belong to all of the sets being compared." },
      { q: "Can a Venn diagram compare three things?", a: "Yes. A three-set Venn diagram has three circles, three pairwise overlaps and a central area shared by all three. In this template, add a third set branch and a branch for each overlap." }
    ],
    related: ["swot-analysis", "decision-tree", "empathy-map", "blank-mindmap"],
    updated: "2026-10-03"
  },

  "six-thinking-hats": {
    seoTitle: "Free Six Thinking Hats Template | Neuron Mapping",
    seoDescription:
      "Free Six Thinking Hats template based on Edward de Bono's method: facts, feelings, caution, benefits, ideas and process. Editable online, no signup.",
    heading: "Six Thinking Hats Template",
    intro: [
      "Six Thinking Hats is a thinking method created by Edward de Bono in his 1985 book of the same name. Instead of everyone arguing from different positions at once, a group looks at a topic from one perspective at a time. Each perspective is represented by a colored hat: facts, feelings, caution, benefits, new ideas, and managing the process.",
      "This template puts your topic in the center with a branch for each hat. Work through the hats one by one, as a team or on your own, and capture what comes up under each. The result is a balanced view of the decision or problem, with both risks and opportunities recorded."
    ],
    whenToUse: [
      "Team decisions where discussions keep going in circles",
      "Evaluating a new idea, product or policy from all sides",
      "Structured brainstorming workshops",
      "Personal decisions where emotions and facts pull in different directions"
    ],
    branches: [
      { name: "White (Facts)", guide: "Information you have and information you need. Stay neutral: data, figures, known facts and gaps." },
      { name: "Red (Feelings)", guide: "Gut reactions, intuition and emotions, stated without needing to justify them." },
      { name: "Black (Caution)", guide: "Risks, weaknesses and reasons something might not work. Critical, but constructive." },
      { name: "Yellow (Benefits)", guide: "Value, benefits and reasons for optimism." },
      { name: "Green (Ideas)", guide: "Creative alternatives, new possibilities, and ways to overcome the problems raised under the Black hat." },
      { name: "Blue (Process)", guide: "Managing the thinking itself: the goal of the session, the order of the hats, and a summary of decisions and next steps." }
    ],
    example: {
      scenario: "Should our team move to a four-day work week?",
      points: [
        "White: current output figures; results of other companies' trials",
        "Red: excitement about more free time; worry about customer coverage",
        "Black: longer days could cause fatigue; support gaps on Fridays",
        "Yellow: better retention and easier hiring",
        "Green: rotate the day off; run a three-month trial",
        "Blue: decide at the end of the month after reviewing the trial data"
      ]
    },
    tips: [
      "Use one hat at a time with the whole group, rather than assigning people to hats.",
      "Start and end with the Blue hat to set the goal and summarize the outcome.",
      "Keep Red hat input short; feelings don't need to be justified.",
      "Don't skip the Black hat. Recording risks early prevents surprises later."
    ],
    faqs: [
      { q: "What do the six thinking hats stand for?", a: "White for facts and information, Red for feelings and intuition, Black for caution and risks, Yellow for benefits and optimism, Green for creativity and new ideas, and Blue for managing the thinking process." },
      { q: "Who created the Six Thinking Hats?", a: "Edward de Bono, a Maltese physician and author who also coined the term \"lateral thinking\". He introduced the method in his 1985 book Six Thinking Hats." }
    ],
    related: ["swot-analysis", "decision-tree", "blank-mindmap", "empathy-map"],
    updated: "2026-10-03"
  },

  "employee-onboarding": {
    seoTitle: "Free Employee Onboarding Checklist Template | Neuron Mapping",
    seoDescription:
      "Free employee onboarding checklist template covering HR prep, IT setup, the manager welcome and day-one training. Plan every new hire's start.",
    heading: "Employee Onboarding Checklist Template",
    intro: [
      "Employee onboarding is everything that happens between a new hire accepting an offer and becoming a productive member of the team. A structured process makes sure contracts are signed, equipment and accounts are ready, and the new person knows who to ask for help. That makes a strong first impression and helps people stay.",
      "This template splits onboarding into the four groups responsible for it: HR, IT, the hiring manager, and day-one training, with a starting task under each. Expand each branch into your own checklist, assign owners, and reuse the map for every new hire."
    ],
    whenToUse: [
      "Preparing for a new hire's first day",
      "Creating a repeatable onboarding process for a growing team",
      "Coordinating tasks between HR, IT and the hiring manager",
      "Onboarding contractors, interns or volunteers"
    ],
    branches: [
      { name: "HR Prep", guide: "Paperwork before day one: the signed contract, tax and payroll forms, policies to acknowledge, benefits enrollment." },
      { name: "IT Setup", guide: "Accounts (email, chat, tools and access rights) and hardware (laptop, phone, peripherals), ready and tested before the start date." },
      { name: "Manager Welcome", guide: "The manager's part: team introductions, a buddy or mentor, the first-week schedule and early goals." },
      { name: "Day 1 Training", guide: "Orientation on the company, tools, security and safety, plus the role-specific training the person needs first." }
    ],
    example: {
      scenario: "Onboarding a new customer support agent",
      points: [
        "HR Prep: contract signed and payroll details collected a week before the start",
        "IT Setup: help desk and chat accounts created; headset delivered",
        "Manager Welcome: team lunch; three days shadowing a senior agent",
        "Day 1 Training: product overview, support tone guide, first practice tickets"
      ]
    },
    tips: [
      "Start before day one; most IT and HR tasks need lead time.",
      "Give every task an owner and a due date relative to the start date, for example \"5 days before\".",
      "Plan beyond the first day with 30-, 60- and 90-day goals.",
      "Ask each new hire for feedback after their first month and update the template."
    ],
    faqs: [
      { q: "What should an employee onboarding checklist include?", a: "Pre-arrival paperwork, equipment and account setup, a welcome and introductions to the team, orientation and training, and goals and check-ins for the first weeks and months." },
      { q: "How long should onboarding last?", a: "The first day and week are the most intense, but many organizations run structured onboarding for 90 days or longer, with regular check-ins, so new hires are fully up to speed." }
    ],
    related: ["org-chart", "compliance-checklist", "okr-planning", "kanban-board"],
    updated: "2026-10-03"
  },

  "product-launch-checklist": {
    seoTitle: "Free Product Launch Checklist Template | Neuron Mapping",
    seoDescription:
      "Free product launch checklist template covering legal, landing pages, marketing and support. Make sure nothing is missed on launch day, with no signup.",
    heading: "Product Launch Checklist Template",
    intro: [
      "A product launch involves many people finishing different tasks by the same date. A checklist keeps them all in one place, so legal requirements are covered, the website is ready, marketing goes out on time, and support can answer customers from day one.",
      "This template groups launch work into four areas, Legal, Landing Pages, Marketing and Support, with three checkpoints under each. Add the tasks that apply to your product, mark each one as it is done, and use the map as the single source of truth in launch meetings."
    ],
    whenToUse: [
      "Launching a new product, app or feature",
      "Opening an online store or releasing a new product line",
      "Coordinating a launch across marketing, legal and support",
      "Reviewing launch readiness in a go/no-go meeting"
    ],
    branches: [
      { name: "Legal", guide: "Terms of service, the privacy policy and data-protection requirements such as GDPR, plus any licences, trademarks or product labeling." },
      { name: "Landing Pages", guide: "The pages people will see: clear copy, SEO basics (titles, descriptions, indexable pages), images, and a working sign-up or checkout." },
      { name: "Marketing", guide: "Announcements on social media and by email, paid ads, and press or community posts, all scheduled for launch day." },
      { name: "Support", guide: "Help docs, team training and an FAQ, so customers get answers quickly when the first questions arrive." }
    ],
    example: {
      scenario: "Launching a mobile budgeting app",
      points: [
        "Legal: privacy policy covers bank data; GDPR consent screens tested",
        "Landing Pages: app store listing and website copy approved; screenshots updated",
        "Marketing: launch email scheduled; social posts queued; small ad budget ready",
        "Support: help center articles live; team trained on the ten most likely questions"
      ]
    },
    tips: [
      "Give every item an owner and a due date, working backwards from launch day.",
      "Mark blockers in red and review them daily in the final week.",
      "Hold a go/no-go review a few days before launch using this map.",
      "After launch, add a Post-launch branch for monitoring, feedback and fixes."
    ],
    faqs: [
      { q: "What should be on a product launch checklist?", a: "Typically: legal and compliance items, the website or store listing, marketing and communications, support readiness, and the technical checks needed for launch day. This template covers the first four and can be extended." },
      { q: "How far in advance should you plan a product launch?", a: "It depends on the product, but many teams start detailed launch planning 6 to 12 weeks ahead, beginning with the legal and marketing tasks that need the longest lead time." }
    ],
    related: ["simple-timeline", "kanban-board", "okr-planning", "customer-journey"],
    updated: "2026-10-03"
  },

  "project-management": {
    seoTitle: "Project Management Mind Map Template | Neuron Mapping",
    seoDescription:
      "Free project management mind map template covering initiation, planning, execution and closure. Plan scope, schedule and budget in one editable map.",
    heading: "Project Management Mind Map Template",
    intro: [
      "Most projects go through the same four phases: you get approval to start, plan the work, do it, and close it out. Seeing those phases on one map makes it easier to spot what nobody has thought about yet, like a budget without an owner or a handover that was never planned.",
      "This template has a Project Lifecycle root with Initiation (Charter, Stakeholders), Planning (Scope, Schedule, Budget), Execution (Deliverables, QA) and Closure (Handover, Review). Add nodes under each phase as the project takes shape, and use status tags to mark what is done."
    ],
    whenToUse: [
      "Kicking off a new project and agreeing on what it includes",
      "Outlining a project charter or plan before writing it up",
      "Explaining the shape of a project to a sponsor or a new team member",
      "Running a small project without a dedicated project management tool"
    ],
    branches: [
      { name: "Initiation", guide: "Write the charter in a sentence or two: the goal, the sponsor, and how you'll know it worked. Under Stakeholders, list everyone who can approve the project, block it, or is affected by it." },
      { name: "Planning", guide: "Scope lists what's in and, just as useful, what's out. Schedule holds the milestones with dates. Budget holds the main cost lines and who signs them off." },
      { name: "Execution", guide: "One node per deliverable, each with an owner. Under QA, note how each deliverable will be checked before it counts as done." },
      { name: "Closure", guide: "Handover covers who takes over the result and what they need from you, such as documents, access or training. Review is where you write down what to repeat and what to change next time." }
    ],
    example: {
      scenario: "Moving a 40-person office to a new building",
      points: [
        "Initiation: the charter says move by 30 June with no more than one day of downtime. Stakeholders are the office manager, IT, the landlord and every team lead.",
        "Planning: scope covers furniture, network and phones but not new hardware. The schedule has lease signing, network install and move weekend. The budget covers movers, cabling and a month of overlapping rent.",
        "Execution: the deliverables are the floor plan, the network install and the packed crates. QA is a test day where IT checks every desk.",
        "Closure: keys and the floor plan go to facilities, followed by a short review of what slowed the move down."
      ]
    },
    tips: [
      "Fill in Scope before Schedule. Dates set before the scope is agreed tend to slip.",
      "Give every deliverable one owner. A task with two owners usually ends up with none.",
      "Tag nodes as In Progress or Done, and filter by status in your weekly check-in.",
      "Keep the Review step even on small projects. Ten minutes of notes saves the next project from the same mistakes."
    ],
    faqs: [
      { q: "What are the phases of project management?", a: "The usual model has four or five: initiation, planning, execution, monitoring and control, and closure. This template folds monitoring into Execution through the QA branch, and you can add a separate branch if your project needs one." },
      { q: "Is a mind map enough to manage a project?", a: "For small projects it often is. For larger ones it works well as the overview and planning tool, next to a task board or timeline for the day-to-day tracking. The Kanban Board and Timeline templates cover those." }
    ],
    related: ["kanban-board", "simple-timeline", "okr-planning", "product-development"],
    updated: "2026-10-04"
  },

  "market-research": {
    seoTitle: "Market Research Mind Map Template | Neuron Mapping",
    seoDescription:
      "Free market research template. Plan the purpose, method, results and analysis of a study, from surveys to pricing and competitors. Editable, no signup.",
    heading: "Market Research Mind Map Template",
    intro: [
      "Market research answers a business question with evidence: do people want this, who would pay for it, and what are they using now? Doing the research is often easier than keeping track of why you started, how you collected the data, and what it actually told you.",
      "This template splits a study into four branches. Purpose (Needs, Risks, Opportunities) holds the questions you want answered. Procedure (Survey, Data, Report) is how you'll answer them. Results (Comparing, Features, Profit) records what you found, and Analysis (Pricing, Demand, Competition) is what it means for the business."
    ],
    whenToUse: [
      "Before launching a product, to check that people want it",
      "Planning a customer survey or a round of interviews",
      "Looking at competitors before setting a price",
      "Pulling research from several sources together for a report or pitch"
    ],
    branches: [
      { name: "Purpose", guide: "Write down the decision the research should support, then list the customer needs, risks and opportunities you want to test. If a question doesn't connect to a decision, drop it." },
      { name: "Procedure", guide: "Survey covers your questions and who you'll ask. Data lists other sources, such as sales figures, industry reports or search trends. Report notes who gets the findings and in what form." },
      { name: "Results", guide: "Record findings as facts, with numbers where you have them. Comparing is for how you stack up against alternatives, Features for what people asked for, and Profit for what they said they would pay." },
      { name: "Analysis", guide: "Turn the results into conclusions about Pricing, Demand and Competition. Keep each conclusion short and point back to the result that supports it." }
    ],
    example: {
      scenario: "A coffee roaster thinking about a subscription service",
      points: [
        "Purpose: decide whether to launch monthly subscriptions this year. The main risk is that customers already buy coffee at the supermarket.",
        "Procedure: an email survey to 2,000 existing customers, plus a look at three competitors' subscription pages.",
        "Results: 31% of people who answered would subscribe, most wanted to be able to skip months, and the typical price they named was $14.",
        "Analysis: demand looks real among existing customers. Price it at $13 to $15 with free skipping, since two of the three competitors charge for skipping."
      ]
    },
    tips: [
      "Write the Purpose branch first and keep it short. Research without a clear question produces a lot of data and no answer.",
      "Put raw notes in node notes rather than in new nodes, so the map stays easy to read.",
      "Keep what people said apart from what they did. Purchase data beats stated intentions.",
      "Date your results. Market research goes stale, and a date shows when it's time to run it again."
    ],
    faqs: [
      { q: "What are the main types of market research?", a: "Primary research is data you collect yourself, through surveys, interviews or tests. Secondary research uses data that already exists, like industry reports, public statistics or competitor websites. Most studies use both, which is why the template has separate Survey and Data nodes." },
      { q: "How many survey responses do I need?", a: "It depends on how precise the answer has to be. As a rough guide, about 100 responses gives a usable read on a simple yes or no question, and a few hundred lets you compare groups, such as new and returning customers." }
    ],
    related: ["swot-analysis", "porters-five-forces", "customer-journey", "empathy-map"],
    updated: "2026-10-04"
  },

  "argument-map": {
    seoTitle: "Argument Map Template with Evidence | Neuron Mapping",
    seoDescription:
      "Free argument map template. Lay out a claim with its reasons, evidence, objections and rebuttals to test an essay, a debate or a decision. No signup needed.",
    heading: "Argument Map Template",
    intro: [
      "An argument map lays out a line of reasoning as a tree. The claim sits at the top, the reasons for it branch out below, and each reason has its evidence underneath. Objections and their rebuttals go on the map too, so you can see where an argument is strong and where it rests on nothing.",
      "The template starts with a Main Contention, two reasons that each have an Evidence node, and an Objection with a Rebuttal. Real arguments are rarely that tidy, so add reasons, attach objections to the reason they target, and let the tree grow as you think it through."
    ],
    whenToUse: [
      "Planning an essay or a persuasive paper",
      "Preparing for a debate, including the other side's points",
      "Testing a proposal at work before you present it",
      "Studying critical thinking or taking apart someone else's argument"
    ],
    branches: [
      { name: "Main Contention", guide: "One sentence that someone could disagree with. \"Remote work is good\" is too vague. \"Our team should keep two remote days a week\" can be argued for and against." },
      { name: "Reasons", guide: "Each reason should support the contention on its own. If two reasons only work together, put them under one node." },
      { name: "Evidence", guide: "Data, sources, examples or expert opinion that back up the reason. A reason with nothing under it is the first place a reader will push back." },
      { name: "Objection and Rebuttal", guide: "The strongest point against your claim, stated fairly, and your answer to it. Attach each objection to the reason it attacks rather than to the top of the map." }
    ],
    example: {
      scenario: "A council member arguing for a protected bike lane on Main Street",
      points: [
        "Contention: the city should build a protected bike lane on Main Street next year.",
        "Reason 1: it would reduce injuries. Evidence: five years of crash data, and results from two similar streets in other cities.",
        "Reason 2: local shops would gain customers. Evidence: a survey of how shoppers get to Main Street today.",
        "Objection: the lane removes 40 parking spaces. Rebuttal: the car park one block away is only 60% full on weekdays."
      ]
    },
    tips: [
      "Write every node as a full sentence. A label like \"Cost\" hides what you are actually claiming.",
      "Find the reasons with the thinnest evidence and work on those first.",
      "Argue against yourself. Add the objection you'd least like to hear.",
      "Use one color for your side and another for the other side, so the balance of the argument is easy to see."
    ],
    faqs: [
      { q: "What is the difference between an argument map and a mind map?", a: "A mind map collects related ideas around a topic. An argument map is stricter: every node has to support or challenge the one above it. You can build one in a mind map tool. The difference is the rule you follow when adding nodes." },
      { q: "Can an argument map help with essay writing?", a: "Yes. Each reason becomes a paragraph or section, its evidence fills that paragraph, and the objection and rebuttal give you a counterargument section. Gaps are often easier to see in the map than in a draft." }
    ],
    related: ["decision-tree", "six-thinking-hats", "swot-analysis", "venn-diagram"],
    updated: "2026-10-04"
  },

  "cycle-diagram": {
    seoTitle: "PDCA Cycle Diagram Template | Neuron Mapping",
    seoDescription:
      "Free cycle diagram template based on Plan-Do-Check-Act, with an added Review step. Map a continuous improvement loop or any repeating process online.",
    heading: "Cycle Diagram Template (Plan, Do, Check, Act)",
    intro: [
      "A cycle diagram shows a process that loops back to the start instead of ending. The best known is PDCA (Plan, Do, Check, Act), also called the Deming cycle, which teams use to improve a process in small, tested steps instead of one big change.",
      "This template has five steps around a central CYCLE node: 1. Plan, 2. Do, 3. Check, 4. Act and 5. Review. Review isn't part of classic PDCA. It's a pause to look back before the next loop starts. You can rename the steps for any repeating process, like a content calendar, a sales cycle or a study routine."
    ],
    whenToUse: [
      "Improving a process step by step, such as cutting a support backlog",
      "Running a pilot before rolling a change out more widely",
      "Showing a process that repeats, like a monthly reporting cycle",
      "Teaching continuous improvement or quality management"
    ],
    branches: [
      { name: "1. Plan", guide: "Name the problem and the change you'll try, and decide what you'll measure to know whether it worked." },
      { name: "2. Do", guide: "Try the change on a small scale, and note anything that didn't go to plan." },
      { name: "3. Check", guide: "Compare the results with what you expected. Did the number move, and was it your change that moved it?" },
      { name: "4. Act", guide: "If it worked, make it the standard way of working. If it didn't, keep what you learned and go back to Plan with a new idea." },
      { name: "5. Review", guide: "Look at the cycle itself. Was it the right problem, and is another loop worth running?" }
    ],
    example: {
      scenario: "A clinic reducing missed appointments",
      points: [
        "Plan: send a text reminder two days before each appointment, and track the no-show rate for a month.",
        "Do: try it with one doctor's patients only.",
        "Check: no-shows for that doctor fell from 12% to 7%, while the rest of the clinic stayed at 11%.",
        "Act: turn on reminders for every doctor.",
        "Review: in the next loop, test whether a second reminder on the day helps."
      ]
    },
    tips: [
      "Keep each loop small. A change you can test in two weeks teaches you more than one that takes six months.",
      "Write the result you expect in Plan before you start, or Check turns into guesswork.",
      "Add child nodes under each step for tasks and owners, and clear them out when a new loop starts.",
      "Save a snapshot at the end of every loop so you keep a record of what you tried."
    ],
    faqs: [
      { q: "What is the PDCA cycle?", a: "PDCA stands for Plan, Do, Check, Act. It's a four-step method for testing and improving a process, made popular by W. Edwards Deming. Each loop tests one change, and what you learn feeds into the next loop." },
      { q: "What is the difference between PDCA and PDSA?", a: "PDSA replaces Check with Study. Deming preferred it because it puts the weight on learning from the results rather than just inspecting them. In practice the steps are almost the same, and this template works for either." }
    ],
    related: ["five-whys", "sprint-retrospective", "okr-planning", "simple-flowchart"],
    updated: "2026-10-04"
  },

  "supplier-evaluation": {
    seoTitle: "Supplier Evaluation Template | Neuron Mapping",
    seoDescription:
      "Free supplier evaluation template. Compare vendors on delivery, risk, cost and quality, with a clear place for each score. Editable mind map, no signup.",
    heading: "Supplier Evaluation Template",
    intro: [
      "Picking a supplier on price alone is a common way to end up with late deliveries and quality problems. A supplier evaluation scores each vendor on the few things that matter to your business, which makes the choice easier to make and easier to explain later.",
      "The template groups the criteria into four branches: Metrics (On-time delivery), Risks (Financial stability), Cost (Unit Price) and Quality (Defect Rate). Each one starts with a single example. Add the other criteria you care about, then make one copy of the map per supplier, or list the suppliers side by side under each criterion."
    ],
    whenToUse: [
      "Choosing between several vendors for a new contract",
      "Reviewing existing suppliers once or twice a year",
      "Deciding whether to keep a supplier after delivery or quality problems",
      "Adding a backup supplier to spread the risk"
    ],
    branches: [
      { name: "Metrics", guide: "Measurable performance, such as on-time delivery rate, order accuracy or lead time. Use real numbers from past orders where you have them." },
      { name: "Risks", guide: "What could go wrong with this supplier: shaky finances, reliance on a single factory, location, or a short trading history." },
      { name: "Cost", guide: "Unit price, but also shipping, minimum order quantities and payment terms. The lowest unit price isn't always the lowest total cost." },
      { name: "Quality", guide: "Defect rate, certifications such as ISO 9001, and how the supplier handles returns and complaints." }
    ],
    example: {
      scenario: "A furniture maker comparing two hinge suppliers",
      points: [
        "Metrics: Supplier A delivered 96% of orders on time last year. Supplier B is new to them, and its references say about 90%.",
        "Risks: A depends on one factory. B has two sites in different countries.",
        "Cost: B is 8% cheaper per unit, but its minimum order is three times larger.",
        "Quality: A's defect rate was 0.4%. B's sample batch came in at 1.1%.",
        "Decision: keep A as the main supplier and give B a small trial order as a backup."
      ]
    },
    tips: [
      "Agree on the criteria and their weights before you look at quotes, so price doesn't end up deciding everything.",
      "Score each criterion from 1 to 5 and put the score in the node, like \"On-time delivery: 4\".",
      "Color the results: green for meets requirements, yellow for keep an eye on it, red for a problem.",
      "Save each review as a snapshot so you can compare it with the next one."
    ],
    faqs: [
      { q: "What criteria should you use to evaluate a supplier?", a: "Most evaluations cover quality, cost, delivery and risk, which are the four branches in this template. Depending on your industry you might add service and communication, sustainability, or technical capability." },
      { q: "How often should suppliers be evaluated?", a: "Key suppliers are usually reviewed once or twice a year, and again after any serious problem. Smaller suppliers can be checked less often, for example when their contract comes up for renewal." }
    ],
    related: ["purchase-requisition", "decision-tree", "compliance-checklist", "swot-analysis"],
    updated: "2026-10-04"
  },

  "product-development": {
    seoTitle: "Product Development Process Template | Neuron Mapping",
    seoDescription:
      "Free product development template with five phases: concept, design, develop, test and launch. Plan a new product from first research to release.",
    heading: "Product Development Process Template",
    intro: [
      "Product development is the work of taking an idea all the way to something customers can use. The phases look much the same for software and physical products: check the idea, design it, build it, test it and release it. Putting them on one map shows how each phase depends on the one before.",
      "The template has a Development Cycle root with five numbered phases: 1. Concept (Research, Feasibility), 2. Design (UI/UX, Prototype), 3. Develop (Frontend, Backend), 4. Test (QA, UAT) and 5. Launch (Deploy, Marketing). The Develop branch is set up for software. For a physical product, rename its nodes to something like Engineering and Manufacturing."
    ],
    whenToUse: [
      "Planning a new product or a large feature from scratch",
      "Getting design, engineering and marketing to agree on the phases",
      "Explaining your development process to a client or investor",
      "Checking a running project for a skipped step, like user testing"
    ],
    branches: [
      { name: "1. Concept", guide: "Research covers the customer's problem and what they use today. Feasibility asks whether you can build it with the time, money and skills you have." },
      { name: "2. Design", guide: "UI/UX holds the user flows and key screens. Prototype is the earliest version you can put in front of real users." },
      { name: "3. Develop", guide: "Split the build into its main parts. For software that's often frontend and backend. Add nodes for integrations or infrastructure if you need them." },
      { name: "4. Test", guide: "QA is your own testing against the spec. UAT (user acceptance testing) is when real users confirm it does what they need." },
      { name: "5. Launch", guide: "Deploy covers the release itself and a plan for rolling back. Marketing covers how people will hear about it." }
    ],
    example: {
      scenario: "A small team building a habit-tracking app",
      points: [
        "Concept: interviews with 15 people who gave up on other habit apps, and a feasibility check that shows a three-month build for two developers.",
        "Design: three core screens and a clickable prototype tested with six users.",
        "Develop: a React Native app and a simple sync backend.",
        "Test: an internal QA pass, then a two-week beta with 50 users.",
        "Launch: release on both app stores, a note to the beta group and a small paid campaign."
      ]
    },
    tips: [
      "Don't skip Feasibility. Dropping an idea at the concept stage costs far less than dropping it after the build.",
      "Prototype early, even with paper sketches. You'll catch design problems before they turn into code.",
      "Add a Post-launch branch for feedback and fixes. The work doesn't stop on release day.",
      "Tag each phase with a status so everyone can see where the project stands."
    ],
    faqs: [
      { q: "What are the stages of product development?", a: "Most models use five to seven: idea or concept, research and feasibility, design, development, testing, launch, and sometimes a post-launch review. This template covers the core five and leaves room for the rest." },
      { q: "What is the difference between QA and UAT?", a: "QA (quality assurance) checks that the product works as specified, and is usually done by the team. UAT (user acceptance testing) checks that it meets the needs of real users, and is done by those users or by the client before release." }
    ],
    related: ["product-launch-checklist", "project-management", "customer-journey", "kanban-board"],
    updated: "2026-10-04"
  },

  "legal-case": {
    seoTitle: "Legal Case Workflow Template | Neuron Mapping",
    seoDescription:
      "Free legal case workflow template. Map a matter from client instructions and document review through to settlement or trial. Editable, no account needed.",
    heading: "Legal Case Workflow Template",
    intro: [
      "Every legal matter follows a path with a few big forks: whether the facts support a claim, whether the other side disputes it, and whether it settles or goes to trial. A workflow map shows that path for one case, so the client, the lawyer handling it and anyone covering for them can see where things stand.",
      "This template is a top-to-bottom flow: Instructions, Background Check, Review Case, Documentation, then a Dispute? decision that splits into Settle (then Close) and Proceeding (then Trial). It's a general outline, not legal advice, so adjust the steps to your jurisdiction and area of practice."
    ],
    whenToUse: [
      "Opening a new matter and agreeing next steps with the client",
      "Handing a file over to a colleague",
      "Explaining to a client how their case is likely to go",
      "Training paralegals or junior staff on the firm's usual process"
    ],
    branches: [
      { name: "Instructions", guide: "What the client wants, the key dates and the agreed scope of work. Put any hard deadline, such as a limitation period, right here at the top." },
      { name: "Background Check and Review Case", guide: "Conflict and identity checks, then a first look at the facts and the law. This is where you decide whether the matter is worth taking further." },
      { name: "Documentation", guide: "Contracts, correspondence, evidence and witness details. Use node notes to record where each document is kept." },
      { name: "Dispute? then Settle or Proceeding", guide: "If the other side accepts the claim or an offer is agreed, the matter settles and closes. If not, it moves to proceedings and possibly a trial." }
    ],
    example: {
      scenario: "A small business chasing an unpaid $18,000 invoice",
      points: [
        "Instructions: recover the debt. The invoice is four months overdue.",
        "Background check: no conflict, and the debtor company is still trading.",
        "Review and documentation: a signed contract, delivery notes and three reminder emails.",
        "Dispute?: the debtor says the work was late and offers $12,000.",
        "Outcome: after some back and forth the client accepts $15,000, and the matter is closed."
      ]
    },
    tips: [
      "Put the most important deadline in red on the first node so nobody can miss it.",
      "Add a child node under each step with the date it was finished.",
      "Record every settlement offer with its date. In some courts, offers affect who pays costs later.",
      "Save a version of the map as a template for each area you handle, such as employment or debt recovery."
    ],
    faqs: [
      { q: "What are the main stages of a civil case?", a: "Broadly: taking instructions and investigating, a demand letter or letter before action, negotiation, starting proceedings, disclosure or discovery, and trial. Most cases settle somewhere along the way, which is why the template splits at the Dispute? step." },
      { q: "Can I keep client documents in the map?", a: "The map works well for tracking which documents exist and where they're kept. Neuron Mapping only saves maps in your browser on your own device, but follow your firm's rules on where confidential client material may be stored." }
    ],
    related: ["compliance-checklist", "decision-tree", "simple-flowchart", "five-whys"],
    updated: "2026-10-04"
  },

  "business-analyst": {
    seoTitle: "Business Analyst Mind Map Template | Neuron Mapping",
    seoDescription:
      "Free business analyst mind map template. Organize the processes, business rules, requirements and resources for a project in one map. Editable online.",
    heading: "Business Analyst Mind Map Template",
    intro: [
      "A business analyst's job is to understand how an organization works today and what has to change, then turn that into requirements a team can build from. That means keeping a lot of threads in view at once: processes, rules, requirements, and the people and tools involved.",
      "This template puts BUSINESS ANALYST at the center with four branches: PROCESSES (Workflows, Analysis), RULES (Compliance, Policies), REQUIREMENTS (Functional, Non-Func) and RESOURCES (Team, Tools). Use it as a one-page overview of a project, or as a checklist so nothing gets missed during discovery."
    ],
    whenToUse: [
      "Starting discovery on a new project or system change",
      "Preparing for stakeholder workshops or interviews",
      "Sorting requirements before writing a specification",
      "Joining a project that someone else started"
    ],
    branches: [
      { name: "PROCESSES", guide: "Workflows describe how the work happens now, step by step. Analysis is where you note problems, delays and what the future process should look like." },
      { name: "RULES", guide: "Compliance covers the laws and regulations the solution has to follow. Policies are internal rules, such as approval limits or how long data is kept." },
      { name: "REQUIREMENTS", guide: "Functional requirements describe what the system must do. Non-functional ones describe how well it must do it: speed, security, availability, accessibility." },
      { name: "RESOURCES", guide: "Team lists the stakeholders and who decides what. Tools lists the existing systems the change has to work with." }
    ],
    example: {
      scenario: "Replacing a paper expense claim process with an app",
      points: [
        "Processes: claims are filled in by hand, signed by a manager, then typed in again by finance. An average claim takes 12 days.",
        "Rules: receipts must be kept for six years, and claims over $500 need a director's approval.",
        "Requirements: staff can photograph receipts in the app (functional), and the app works offline on phones (non-functional).",
        "Resources: finance, two pilot teams and IT. The app has to connect to the existing accounting system."
      ]
    },
    tips: [
      "Ask why a step exists before you write it down. Some \"rules\" turn out to be habits.",
      "Note where each requirement came from, so you know who to ask when it's unclear.",
      "Use colors to mark requirements as must have, should have or could have.",
      "Keep interview notes in node notes instead of adding more nodes, so the map stays readable."
    ],
    faqs: [
      { q: "What does a business analyst do?", a: "A business analyst studies how an organization works, finds problems and opportunities, and defines what needs to change, usually as requirements for a new or updated system or process. They sit between the business and the people building the solution." },
      { q: "What is the difference between functional and non-functional requirements?", a: "Functional requirements say what a system does, for example \"users can submit an expense claim\". Non-functional requirements say how well it does it, for example \"pages load in under two seconds\" or \"data is encrypted at rest\"." }
    ],
    related: ["simple-flowchart", "customer-journey", "swot-analysis", "compliance-checklist"],
    updated: "2026-10-04"
  },

  "order-fulfillment": {
    seoTitle: "Order Fulfillment Process Template | Neuron Mapping",
    seoDescription:
      "Free order fulfillment process template. Map each step from order to shipping, including stock checks, packing, labels and invoicing. Editable online.",
    heading: "Order Fulfillment Process Template",
    intro: [
      "Order fulfillment is everything between a customer paying and the parcel arriving: checking stock, picking items, packing, labelling, shipping and invoicing. When orders go missing or ship late, the cause is usually a handoff between two of those steps that nobody owns.",
      "This template is laid out like a swimlane flowchart. From the Order Fulfillment root it runs through Place Order, Manage Stock, Pick Ticket and Cargo Coord, with steps such as Weigh Pkg, Print Labels, Tracking, Load Trucks, Invoice and Ship Order along the way. Rename the lanes to match the teams or systems in your own operation."
    ],
    whenToUse: [
      "Writing down how orders move through a warehouse or a small shop",
      "Finding the step that causes late or wrong shipments",
      "Training new warehouse or customer service staff",
      "Planning a move to a new courier or e-commerce platform"
    ],
    branches: [
      { name: "Place Order", guide: "How orders come in: website, marketplace, phone or email. Then the packing steps: weighing the parcel, printing labels and sending tracking details to the customer." },
      { name: "Manage Stock", guide: "How stock is checked and reserved when an order arrives, and what happens when an item is out of stock." },
      { name: "Pick Ticket", guide: "The list warehouse staff use to pick the items, followed by loading and invoicing." },
      { name: "Cargo Coord and Ship Order", guide: "Booking couriers or freight, handing over the parcels, and confirming that the order has shipped." }
    ],
    example: {
      scenario: "An online plant shop shipping 150 orders a day",
      points: [
        "Orders come from the website and one marketplace, and both feed a single order list.",
        "Stock is checked automatically, but any plant that looks unhealthy on the day gets swapped by hand.",
        "Pick tickets print at 9 am and 1 pm. Anything ordered after 1 pm ships the next day.",
        "Labels and tracking emails come from the courier's app, and the courier collects at 4 pm.",
        "Mapping it showed that invoices only went out after shipping, which confused customers whose orders were split."
      ]
    },
    tips: [
      "Map the process as it really runs today, not as it's supposed to run. The gaps are what you're looking for.",
      "Mark each step with the person or system responsible for it.",
      "Add cut-off times to the nodes. Missed cut-offs are a common cause of late orders.",
      "Color the steps where mistakes happen most often, and start fixing there."
    ],
    faqs: [
      { q: "What are the steps of order fulfillment?", a: "Usually: receiving the order, checking and reserving stock, picking, packing, labelling, shipping, and handling returns, with invoicing and customer updates running alongside. The exact order depends on your systems and couriers." },
      { q: "What is a swimlane diagram?", a: "A flowchart split into lanes, one per person, team or system, so you can see who does each step and where work passes from one to another. Those handoffs are where most delays happen, and the lanes make them easy to spot." }
    ],
    related: ["simple-flowchart", "purchase-requisition", "kanban-board", "customer-journey"],
    updated: "2026-10-04"
  },

  "purchase-requisition": {
    seoTitle: "Purchase Requisition Process Template | Neuron Mapping",
    seoDescription:
      "Free purchase requisition process template. Map a request through budget and stock checks, approval, the purchase order and receipt of the goods.",
    heading: "Purchase Requisition Process Template",
    intro: [
      "A purchase requisition is an internal request to buy something. Before anyone places an order, the request is checked against the budget and existing stock, approved by the right person, and turned into a purchase order for the supplier. It's a simple process, but when nobody writes it down, steps get skipped and people don't know who approves what.",
      "The template follows that path: Purchase Request, then Requisition, then Approval (with Budget Check and Stock Check next to it), then Purchase Order and finally Receive Goods. Add your own approval levels and the person who holds each one."
    ],
    whenToUse: [
      "Setting up a purchasing process in a growing company",
      "Showing staff how to request equipment or supplies",
      "Tightening spending controls or getting ready for an audit",
      "Finding out why purchase requests take so long"
    ],
    branches: [
      { name: "Requisition", guide: "What's needed, how many, by when and why. A good request also names a preferred supplier and an estimated cost." },
      { name: "Budget Check and Stock Check", guide: "Is there budget left for this cost center, and do we already have the item somewhere else in the business?" },
      { name: "Approval", guide: "Who can approve which amounts. Write the limits into the node, for example team lead up to $1,000 and finance director above that." },
      { name: "Purchase Order", guide: "The official order sent to the supplier, with a PO number that follows the purchase all the way to the invoice." },
      { name: "Receive Goods", guide: "Checking the delivery against the PO before the invoice is paid." }
    ],
    example: {
      scenario: "A design studio buying two new laptops",
      points: [
        "Requisition: two laptops for new hires starting on the 1st, at about $2,400 each.",
        "Stock check: there are no spare laptops in the office.",
        "Budget check: $6,000 is left in this quarter's equipment budget.",
        "Approval: the total is over $1,000, so the studio manager signs it off.",
        "Purchase order PO-0412 goes to the usual supplier. The laptops are checked when they arrive, and the invoice is matched to the PO."
      ]
    },
    tips: [
      "Write the approval limits on the map so nobody has to ask.",
      "Match the delivery and the invoice to the PO before paying. This three-way match catches most billing mistakes.",
      "Add a branch for urgent purchases, so people don't skip the process when they're in a hurry.",
      "Connect Receive Goods to whoever handles returns for damaged or wrong items."
    ],
    faqs: [
      { q: "What is the difference between a purchase requisition and a purchase order?", a: "A purchase requisition is an internal request to buy something, sent to a manager or the purchasing team. A purchase order is the document sent to the supplier once the request is approved, and it commits the business to paying." },
      { q: "Who approves a purchase requisition?", a: "Usually the requester's manager, with larger amounts going to finance or a director. Most organizations set approval limits by amount, and the Approval branch of this template is where you record them." }
    ],
    related: ["supplier-evaluation", "order-fulfillment", "compliance-checklist", "simple-flowchart"],
    updated: "2026-10-04"
  },

  "layer-stacking": {
    seoTitle: "Technology Stack Diagram Template | Neuron Mapping",
    seoDescription:
      "Free layered architecture template. Draw a technology stack from the presentation and API layers down to business logic and data. Editable, no signup.",
    heading: "Technology Stack Layer Diagram Template",
    intro: [
      "A layer diagram shows a system as a stack, where each layer depends only on the layers below it. It's the quickest way to explain how a piece of software is put together, and to point at where a new feature or a problem sits.",
      "This template stacks four layers under a Technology Stack node: Presentation Layer, API Gateway, Business Logic and Data Layer. The nodes use the isometric shape, so in the editor the map looks like a stack of blocks. Add child nodes to each layer for the frameworks, services and databases it contains."
    ],
    whenToUse: [
      "Explaining a system's architecture to new developers",
      "Writing architecture docs or a design proposal",
      "Planning a migration, such as moving one layer to a new technology",
      "Teaching layered architecture in a software course"
    ],
    branches: [
      { name: "Presentation Layer", guide: "What users see and use: web apps, mobile apps, admin dashboards." },
      { name: "API Gateway", guide: "The single entry point for requests, handling routing, authentication and rate limits." },
      { name: "Business Logic", guide: "The rules of the application, often split into services such as orders, billing or search." },
      { name: "Data Layer", guide: "Databases, caches, file storage and search indexes, along with what each one holds." }
    ],
    example: {
      scenario: "An online booking system for a chain of gyms",
      points: [
        "Presentation: a React website, iOS and Android apps, and a dashboard for staff.",
        "API gateway: a managed gateway that handles logins and rate limits.",
        "Business logic: separate services for class schedules, bookings and payments.",
        "Data: PostgreSQL for bookings, Redis for live class availability, and object storage for trainer photos."
      ]
    },
    tips: [
      "Describe what each layer does in the layer node, and put tool names in its child nodes.",
      "Color the parts that change in a migration so the scope is obvious.",
      "Add a side branch for things that cut across every layer, like logging, monitoring and security.",
      "Keep the diagram up to date. An out-of-date architecture diagram misleads people more than having none."
    ],
    faqs: [
      { q: "What is layered architecture?", a: "A way of organizing software into horizontal layers, such as presentation, business logic and data, where each layer only uses the one below it. Keeping concerns apart like this lets you change one layer without rewriting the others." },
      { q: "What is the difference between a tech stack and an architecture diagram?", a: "A tech stack is the list of technologies a system uses. An architecture diagram shows how the parts fit together. A layer diagram does a bit of both: the layers show the structure, and the child nodes name the tools." }
    ],
    related: ["business-analyst", "product-development", "simple-flowchart", "project-management"],
    updated: "2026-10-04"
  }
};

export function getTemplateContent(id: string): TemplateContent | undefined {
  return isIndexableTemplate(id) ? templateContent[id] : undefined;
}

export function getTemplateSeo(template: Template) {
  const content = getTemplateContent(template.id);
  const path = templatePath(template.id);
  return {
    path,
    title: content?.seoTitle ?? templateSeoTitle(template.name),
    description: content?.seoDescription ?? templateSeoDescription(template.name, template.nodes.length),
    heading: content?.heading ?? `${template.name} Mind Map Template`,
    robots: content ? undefined : "noindex, follow",
    previewImage: templatePreviewPath(template.id),
    ogImage: templateOgImagePath(template.id),
    imageAlt: `${templateSearchName(template)} template as a mind map`,
    jsonLd: [
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Templates", path: TEMPLATES_PATH },
        { name: template.name, path }
      ]),
      ...(content ? [faqPageJsonLd(content.faqs)] : [])
    ]
  };
}
