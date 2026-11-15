// scripts/add-m365-outage-blog.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const M365_BLOG = {
  title: "Microsoft 365 Worldwide Outage: Teams, Outlook, and SharePoint Disruption (Incident MO1550821) — Root Cause & Official Resolution",
  slug: "microsoft-365-teams-outlook-sharepoint-outage-mo1550821",
  summary: "A technical post-mortem of the global Microsoft 365 outage impacting Teams, Outlook, SharePoint, and OneDrive: How an internal network change triggered TLS process saturation, cascading health-check failures, and Microsoft's official resolution.",
  coverImage: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80",
  readingTime: 8,
  views: 3120,
  isFeatured: true,
  publishedAt: new Date(), // Latest published
  tags: ["Microsoft", "Cloud Outage", "Architecture", "DevOps"],
  content: `
    <h2>Global Disruption Across Microsoft 365 Core Services</h2>
    <p>Organizations worldwide encountered widespread outages across foundational Microsoft 365 services. Millions of enterprise users experienced connection timeouts, authentication failures, and severe service degradation across <strong>Microsoft Teams</strong>, <strong>Outlook (Exchange Online)</strong>, <strong>SharePoint Online</strong>, <strong>OneDrive for Business</strong>, and <strong>Microsoft Copilot</strong>.</p>

    <p>The outage was officially tracked in the Microsoft 365 Service Health Dashboard under:</p>
    <ul>
      <li><strong>Suite-level Incident Advisory:</strong> <code>MO1550821</code> (covering multi-service tenant impacts)</li>
      <li><strong>Core Exchange / Outlook Advisory:</strong> <code>EX1550543</code></li>
    </ul>

    <blockquote>
      "Users were unable to send or receive emails via Outlook, join Microsoft Teams video conferences, access synchronized documents in SharePoint/OneDrive, or interact with Copilot workspaces."
    </blockquote>

    <h2>The Technical Root Cause: Network Capacity & TLS Handshake Saturation</h2>
    <p>Unlike previous outages caused by DNS misconfigurations or external fiber cuts, Microsoft’s post-incident investigation revealed an unexpected cascading failure initiated during an internal network capacity optimization:</p>

    <ol>
      <li><strong>The Triggering Network Change:</strong> Engineers rolled out a routine network infrastructure update to rebalance traffic loads across regional gateway clusters.</li>
      <li><strong>SSL/TLS Connection Process Saturation:</strong> A core internal software process responsible for terminating secure client connections and managing session tokens became overwhelmed by an unexpected traffic surge following the routing adjustment.</li>
      <li><strong>Automated Health Check Failures:</strong> As CPU utilization peaked on affected front-end nodes, automated health monitor probes began failing. The automated traffic manager erroneously marked healthy proxy servers as unhealthy, pulling them out of the global load balancing pool.</li>
      <li><strong>Cascading Concentration Loop:</strong> Diverting millions of incoming Teams and Outlook client reconnects onto the surviving infrastructure instantly overwhelmed the remaining nodes, causing service blackouts across North America, Europe, and Asia-Pacific.</li>
    </ol>

    <h2>No Cyberattack or External Malicious Activity</h2>
    <p>Microsoft officially confirmed that telemetry showed <strong>no evidence of a Distributed Denial of Service (DDoS) attack</strong> or external adversarial intrusion. The incident was entirely an internal architectural cascade caused by health-check threshold sensitivities under sudden load reallocation.</p>

    <h2>Is the Outage Fixed? (Official Microsoft Declaration)</h2>
    <p><strong>YES. The outage has been officially declared resolved by Microsoft.</strong></p>

    <p>Microsoft engineering teams executed a multi-phase mitigation strategy:</p>
    <ul>
      <li><strong>Targeted Routing Rollbacks:</strong> Reverted the triggering network configuration changes across upstream core edge routers.</li>
      <li><strong>Phased Infrastructure Restarts:</strong> Safely brought offline server clusters back into the load balancing pool in controlled geographic batches to prevent inrush reconnection spikes.</li>
      <li><strong>Official Resolution Notice:</strong> Microsoft issued its final advisory confirmation stating: <em>"We have verified that the underlying issue has been fully addressed, telemetry has returned to healthy operating baselines, and full service functionality has been restored across all Microsoft 365 workloads."</em></li>
    </ul>

    <h2>Official Verification & Source Tracking URLs</h2>
    <p>IT administrators, enterprise security teams, and engineering leads can inspect the complete telemetry, timestamps, and Post-Incident Review (PIR) reports through the following official sources:</p>

    <ul>
      <li><a href="https://status.cloud.microsoft" target="_blank" rel="noopener noreferrer"><strong>Microsoft 365 Service Health Portal:</strong> status.cloud.microsoft</a></li>
      <li><a href="https://admin.microsoft.com" target="_blank" rel="noopener noreferrer"><strong>Microsoft 365 Admin Center:</strong> Health &gt; Service Health (Incident MO1550821 / EX1550543)</a></li>
      <li><a href="https://x.com/MSFT365Status" target="_blank" rel="noopener noreferrer"><strong>Microsoft 365 Status Official X Handle:</strong> @MSFT365Status</a></li>
      <li><a href="https://www.securityweek.com" target="_blank" rel="noopener noreferrer"><strong>SecurityWeek Incident Coverage:</strong> Major Cloud Outage Report</a></li>
      <li><a href="https://petri.com" target="_blank" rel="noopener noreferrer"><strong>Petri IT Knowledgebase:</strong> Microsoft 365 Teams &amp; Outlook Outage Post-Mortem</a></li>
    </ul>
  `,
};

async function main() {
  const admin = await prisma.user.findFirst({
    where: {
      OR: [{ email: "sumitgandhi932@gmail.com" }, { role: "ADMIN" }],
    },
  });

  if (!admin) {
    console.error("Admin user not found");
    process.exit(1);
  }

  // Ensure tags
  const tagIds = [];
  for (const name of M365_BLOG.tags) {
    const t = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    tagIds.push(t.id);
  }

  // Upsert Blog
  const blog = await prisma.blog.upsert({
    where: { slug: M365_BLOG.slug },
    update: {
      title: M365_BLOG.title,
      summary: M365_BLOG.summary,
      content: M365_BLOG.content.trim(),
      coverImage: M365_BLOG.coverImage,
      published: true,
      publishedAt: M365_BLOG.publishedAt,
      status: "PUBLISHED",
      isFeatured: M365_BLOG.isFeatured,
      readingTime: M365_BLOG.readingTime,
      views: M365_BLOG.views,
      tags: {
        set: tagIds.map((id) => ({ id })),
      },
    },
    create: {
      title: M365_BLOG.title,
      slug: M365_BLOG.slug,
      summary: M365_BLOG.summary,
      content: M365_BLOG.content.trim(),
      coverImage: M365_BLOG.coverImage,
      published: true,
      publishedAt: M365_BLOG.publishedAt,
      status: "PUBLISHED",
      isFeatured: M365_BLOG.isFeatured,
      readingTime: M365_BLOG.readingTime,
      views: M365_BLOG.views,
      authorId: admin.id,
      createdAt: M365_BLOG.publishedAt,
      tags: {
        connect: tagIds.map((id) => ({ id })),
      },
    },
  });

  console.log(`✓ Successfully upserted Microsoft 365 outage post: ${blog.title}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
