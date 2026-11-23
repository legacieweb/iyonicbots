require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const crypto = require("crypto");  // For encryption
const bodyParser = require("body-parser");

const app = express();
app.use(express.json());
app.use(cors());


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log("MongoDB Connection Error:", err));


// User Schema
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    resetCode: String,
});

const User = mongoose.model("User", UserSchema);

// Email Transporter (Nodemailer)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 📝 Register API (with Email Notification)
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });

    await newUser.save();

    // Send Welcome Email
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Welcome to LegacyBots!",
        text: `Hello ${name},\n\nThank you for signing up on LegacyBots. Start using our AI services now!\n\nBest,\nLegacyBots Team`
    };

    transporter.sendMail(mailOptions, (error) => {
        if (error) console.log(error);
    });

    res.status(201).json({ message: "✔️Redirecting to login!! check email or spam email later!" });
});

// 🔑 Login API
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token, user: { name: user.name, email: user.email } });
});

// 🔄 Password Reset Request API
app.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Email not found" });

    // Generate Reset Code
    const resetCode = uuidv4().substring(0, 6);  // 6-digit code
    user.resetCode = resetCode;
    await user.save();

    // Send Reset Code via Email
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset Code",
        text: `Hello,\n\nYour password reset code is: ${resetCode}\n\nUse this code to reset your password.\n\nBest,\nLegacyBots Team`
    };

    transporter.sendMail(mailOptions, (error) => {
        if (error) console.log(error);
    });

    res.status(200).json({ message: "Reset code sent to email!" });
});

// 🔄 Password Reset API
app.post("/reset-password", async (req, res) => {
    const { email, resetCode, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.resetCode !== resetCode) return res.status(400).json({ message: "Invalid reset code" });

    // Hash New Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetCode = null;  // Clear the reset code
    await user.save();

    res.status(200).json({ message: "Password reset successfully!" });
});
// ✅ Define Schema & Model
const responseSchema = new mongoose.Schema({
    question: { type: String, required: true, unique: true },
    answer: { type: String, required: true }
});
const ChatResponse = mongoose.model("ChatResponse", responseSchema);


// ✅ Business Advice
const responses = [
    {
        keywords: ["how to start a business", "start a business", "business startup", "entrepreneurship"],
        answer: `Starting a business requires careful planning. Follow these steps:
        1️⃣ Find Your Business Idea – Identify a profitable niche that solves a problem.
        2️⃣ Market Research – Analyze demand, competitors, and target audience.
        3️⃣ Create a Business Plan – Define your strategy, budget, and goals.
        4️⃣ Choose a Legal Structure – Register as an LLC, Corporation, or Sole Proprietor.
        5️⃣ Secure Funding – Consider bootstrapping, investors, bank loans, or crowdfunding.
        6️⃣ Register Your Business – Obtain necessary licenses and tax registrations.
        7️⃣ Build a Brand – Create a logo, website, and social media presence.
        8️⃣ Develop Your Product or Service – Ensure quality and market fit.
        9️⃣ Launch and Market – Use digital marketing, social media, and sales strategies to attract customers.
        🔟 Monitor & Improve – Track performance and adapt to changes.`
    },

    

    {
        keywords: ["business plan", "create a business plan"],
        answer: `A solid business plan helps secure funding and guides your growth. It should include:
        📌 Executive Summary – Brief overview of your company and goals.
        📌 Business Description – What your business does, your niche, and your mission.
        📌 Market Research – Analysis of competitors, customer demographics, and industry trends.
        📌 Products & Services – What you offer and how it solves customer problems.
        📌 Revenue Model – Pricing strategy, revenue streams, and cost structure.
        📌 Marketing & Sales Strategy – How you plan to attract and retain customers.
        📌 Operational Plan – Day-to-day business processes, suppliers, and logistics.
        📌 Financial Projections – Sales forecasts, profit and loss statements, and funding requirements.
        📌 Funding Plan – How you’ll raise capital, whether through investors, loans, or grants.`
    },

    {
        keywords: ["business growth", "scaling a business"],
        answer: `To scale your business, you need a strong strategy. Here’s how:
        🚀 1. Optimize Your Sales Process – Automate sales funnels, upsell existing customers, and improve conversion rates.
        🚀 2. Expand Marketing Efforts – Invest in paid ads, content marketing, and social media strategies.
        🚀 3. Improve Customer Retention – Offer loyalty programs, exceptional customer service, and personalized interactions.
        🚀 4. Expand Your Team – Hire employees or outsource tasks to improve efficiency.
        🚀 5. Diversify Revenue Streams – Add new products, services, or expand to new markets.
        🚀 6. Strengthen Financial Management – Keep track of cash flow, reinvest profits, and optimize pricing.
        🚀 7. Leverage Technology – Use AI-driven automation, CRMs, and e-commerce tools to scale efficiently.
        🚀 8. Improve Operational Efficiency – Automate repetitive tasks, streamline workflows, and reduce waste.
        🚀 9. Build Strategic Partnerships – Collaborate with other businesses to expand your reach.
        🚀 10. Measure & Adapt – Continuously analyze business data to refine your growth strategy.`
    },
    {
        keywords: ["business idea", "find business idea", "startup idea"],
        answer: `Finding a business idea involves research and strategy. Follow these steps:
    
        1️⃣ Identify Problems to Solve  
        - Look at daily frustrations or inefficiencies people face.  
        - Explore industries where customer complaints are common.  
        - Think about services/products that could be improved.
    
        2️⃣ Analyze Market Demand  
        - Use Google Trends, keyword research, and industry reports to find growing sectors.  
        - Check if people are actively searching for solutions to your idea.  
    
        3️⃣ Look at Your Skills & Interests  
        - What are you passionate about? A business aligned with your skills has a higher success rate.  
        - Consider industries where you have experience or expertise.  
    
        4️⃣ Validate Your Idea with Research  
        - Survey potential customers to get real feedback.  
        - Test demand by creating a landing page or a pre-order system.  
    
        5️⃣ Identify Your Target Audience  
        - Who are your ideal customers?  
        - Define their problems, spending habits, and preferences.  
    
        6️⃣ Check Profitability & Costs  
        - Can you generate consistent revenue?  
        - Research how much investment is needed vs. the potential profit.  
    
        7️⃣ Evaluate the Competition  
        - Are there already successful businesses in this space?  
        - Find ways to offer something unique or improve existing products.  
    
        8️⃣ Choose a Scalable Model  
        - Can the business grow without increasing costs significantly?  
        - Online businesses, digital products, and automation-friendly services scale well.  
    
        💡 Example Profitable Business Ideas:  
        - E-commerce niche stores (customized gifts, eco-friendly products, pet accessories)  
        - Subscription box services (fitness gear, gourmet snacks, self-care kits)  
        - Online coaching/consulting (business strategy, fitness, career coaching)  
        - AI & Automation Services (chatbots, process automation for small businesses)  
        - Digital products (ebooks, online courses, design templates)  
    
        ✅ Once you find an idea, test it! Start small, validate demand, and scale up wisely.`
    },
    {
        keywords: ["market research", "analyze market", "business research"],
        answer: `Market research helps you understand your industry, customers, and competition. Follow these steps:
    
        1️⃣ Identify Your Industry Trends  
        - Use Google Trends and industry reports to track market growth.  
        - Follow news and reports from Statista, IBISWorld, or McKinsey.  
        - Look at consumer behavior shifts (e.g., sustainability, automation, e-commerce growth).  
    
        2️⃣ Define Your Target Audience  
        - Who are your ideal customers? Consider:  
          ✅ Age, location, gender, and profession.  
          ✅ Interests, buying behaviors, and pain points.  
          ✅ Spending habits and income levels.  
        - Use tools like Facebook Audience Insights and Google Analytics to define your audience.  
    
        3️⃣ Research Competitors  
        - Identify your top 5 competitors and analyze:  
          📌 Their pricing, marketing strategy, and unique value.  
          📌 Customer reviews (Google, TrustPilot, social media complaints).  
          📌 Website performance, social media activity, and SEO ranking.  
        - Tools like SEMrush, Ahrefs, and SimilarWeb can help track competitor traffic and keywords.  
    
        4️⃣ Analyze Market Demand  
        - Use Google Keyword Planner to see how many people search for your product/service.  
        - Check forums like Reddit and Quora to see real customer concerns.  
        - Conduct surveys and polls to get direct feedback from potential customers.  
    
        5️⃣ Validate Your Business Idea  
        - Create a landing page and run ads to test demand.  
        - Use pre-orders, waitlists, or beta testing before launching.  
        - Ask potential customers if they would pay for your solution.  
    
        💡 Example Tools for Market Research:  
        - Google Trends → Track search trends.  
        - SEMrush / Ahrefs → Analyze competitors.  
        - SurveyMonkey → Conduct surveys.  
        - Ubersuggest → Find high-demand keywords.  
    
        ✅ Market research helps you launch with confidence and avoid failure. Analyze before investing!`
    },
    {
        keywords: ["business plan", "create a business plan", "write business plan"],
        answer: `A business plan is essential for securing funding and guiding your company's growth. Follow these steps:
    
        1️⃣ Executive Summary  
        - A one-page overview of your business, mission, and goals.  
        - Should quickly explain what problem your business solves.  
        - Investors often read this first—make it compelling!
    
        2️⃣ Business Description  
        - What does your business do?  
        - Define your unique selling proposition (USP).  
        - Explain why your business is valuable in the market.
    
        3️⃣ Market Research & Industry Analysis  
        - Identify your target market and potential customers.  
        - Analyze competitors and industry trends.  
        - Use data from Google Trends, Statista, and industry reports.  
    
        4️⃣ Products & Services  
        - What are you selling? Is it a product, service, or both?  
        - How does it benefit customers?  
        - What makes it different from competitors?
    
        5️⃣ Revenue Model & Pricing Strategy  
        - How will your business make money?  
        - Detail your pricing, profit margins, and recurring revenue streams.  
        - Compare with competitors and ensure profitability.
    
        6️⃣ Marketing & Sales Strategy  
        - How will you acquire customers?  
        - Strategies may include SEO, social media, paid ads, email marketing.  
        - Consider a sales funnel for converting leads into paying customers.
    
        7️⃣ Operational Plan  
        - Day-to-day business operations.  
        - Supply chain, logistics, and customer support plans.  
        - Technology and automation tools for efficiency.
    
        8️⃣ Financial Plan & Projections  
        - Expected revenue and profit margins for the next 3-5 years.  
        - Cost structure: salaries, rent, software, and marketing expenses.  
        - Funding needs: How much capital is required, and where will it come from?
    
        9️⃣ Risk Assessment & Contingency Plan  
        - Identify potential risks (economic downturns, competition, operational failures).  
        - Create backup plans for business continuity.
    
        🔟 Funding Strategy (If Needed)  
        - Will you self-fund, get investors, apply for loans, or use crowdfunding?  
        - Have a clear financial ask if approaching investors.
    
        ✅ A well-prepared business plan increases your chances of success and investment opportunities! Start drafting today.`
    },
    {
        keywords: ["business structure", "legal structure", "LLC vs corporation", "sole proprietorship", "register business"],
        answer: `Choosing the right legal structure is crucial for taxes, liability, and business operations. Here’s a breakdown:
    
        1️⃣ Sole Proprietorship (✅ Best for small, one-person businesses)  
        - Owned by one person, easy to set up.  
        - Minimal paperwork, lower startup costs.  
        - Downside: The owner is personally liable for business debts.  
    
        2️⃣ Limited Liability Company (LLC) (✅ Best for small-to-medium businesses)  
        - Protects personal assets from business debts (limited liability).  
        - Simple taxation—profits pass through to owners.  
        - Best for: Freelancers, consultants, e-commerce, small startups.  
    
        3️⃣ Corporation (C-Corp & S-Corp) (✅ Best for raising investment)  
        - C-Corp: Separate legal entity (pays its own taxes). Good for large businesses & investors.  
        - S-Corp: Avoids double taxation but has ownership restrictions.  
        - Downside: More paperwork & government regulations.  
    
        4️⃣ Partnership (General & Limited Partnership) (✅ Best for co-owned businesses)  
        - General Partnership: Owners share profits, but also debts.  
        - Limited Partnership: One partner manages, others invest.  
        - Good for professional services (law firms, agencies).  
    
        5️⃣ Nonprofit Organization (✅ Best for charities & social businesses)  
        - Tax-exempt but must reinvest profits into the mission.  
        - Requires strict legal compliance & annual reporting.  
    
        💡 How to Register Your Business:  
        1️⃣ Choose a name & check for availability.  
        2️⃣ Register with the government & tax authorities.  
        3️⃣ Get an Employer Identification Number (EIN) from the IRS (for US businesses).  
        4️⃣ Open a business bank account & apply for necessary licenses & permits.  
    
        ✅ The right structure depends on your business goals, liability concerns, and tax preferences.`
    },
    {
        keywords: ["business funding", "secure funding", "get investors", "business loan", "crowdfunding"],
        answer: `Securing funding is essential for launching and growing your business. Here are the top funding options:
    
        1️⃣ Bootstrapping (Self-Funding)
        - Use your personal savings or business revenue.
        - Gives you full control over the business.
        - Best for: Small businesses, startups with low capital needs.
        - Downside: Growth may be slower without external capital.
    
        2️⃣ Investors (Angel Investors & Venture Capitalists)
        - Angel Investors: Wealthy individuals who invest in early-stage startups.
        - Venture Capitalists (VCs): Firms that invest large sums in exchange for equity.
        - Best for: High-growth startups with scalable potential.
        - Downside: Investors take ownership and decision-making influence.
    
        3️⃣ Bank Loans & Small Business Loans
        - Traditional bank loans require a solid business plan and credit history.
        - SBA (Small Business Administration) Loans (for U.S. businesses) offer lower interest rates.
        - Best for: Established businesses needing expansion capital.
        - Downside: Requires collateral & repayment with interest.
    
        4️⃣ Crowdfunding (Kickstarter, GoFundMe, Indiegogo)
        - Raise money from the public by offering pre-orders or rewards.
        - Ideal for innovative products or community-driven projects.
        - Best for: Startups with a strong online presence.
        - Downside: Success isn’t guaranteed—requires great marketing.
    
        5️⃣ Business Grants & Competitions
        - Government and private grants provide free money (no repayment).
        - Business pitch competitions (like Shark Tank) offer funding.
        - Best for: Social enterprises, non-profits, and research-based startups.
        - Downside: Grants are highly competitive and often require detailed applications.
    
        6️⃣ Revenue-Based Financing
        - Investors provide funds in exchange for a percentage of future revenue.
        - No need to give up equity but requires consistent revenue.
        - Best for: Businesses with steady sales but no collateral.
    
        💡 How to Prepare for Funding:
        1️⃣ Have a detailed business plan (financials, market strategy, and revenue projections).  
        2️⃣ Build a strong pitch deck to attract investors.  
        3️⃣ Improve your credit score (for bank loans).  
        4️⃣ Research government grants and industry-specific funding options.  
    
        ✅ The best funding option depends on your business model, risk tolerance, and growth plans.`
    },    
    
    {
        keywords: ["register business", "business registration", "how to register a business", "business license", "tax registration"],
        answer: `Registering your business is a crucial step to operating legally. Follow these steps:
    
        1️⃣ Choose a Business Name  
        - Ensure the name is unique by checking trademark databases and your country's business registry.  
        - Register a matching domain name for online presence.  
    
        2️⃣ Select a Business Structure  
        - Sole Proprietorship → Simple, but personal liability.  
        - LLC (Limited Liability Company) → Protects personal assets.  
        - Corporation (C-Corp, S-Corp) → Ideal for scaling and attracting investors.  
    
        3️⃣ Register with Government Authorities  
        - File your business registration with your local/state/provincial/national government.  
        - In the U.S., use the Small Business Administration (SBA) or state websites.  
        - In the U.K., register with Companies House.  
        - In Canada, register with the Business Registration Online (BRO) system.  
    
        4️⃣ Obtain an EIN or Tax ID  
        - Apply for an Employer Identification Number (EIN) or Taxpayer Identification Number (TIN).  
        - Required for tax purposes, hiring employees, and opening a business bank account.  
        - In the U.S., get an EIN from the IRS website.  
    
        5️⃣ Apply for Business Licenses & Permits  
        - Depending on your industry, you may need:  
          📌 General Business License (local authority requirement).  
          📌 Health & Safety Permits (for food businesses, medical, or manufacturing).  
          📌 Professional Licenses (for legal, financial, or medical services).  
    
        6️⃣ Open a Business Bank Account  
        - Separating business and personal finances protects assets and simplifies taxes.  
        - Requirements: Business registration certificate, EIN, and proof of business address.  
    
        7️⃣ Register for Taxes  
        - Sales Tax (VAT/GST) → Required if selling products.  
        - Income Tax → File annual returns based on profits.  
        - Payroll Taxes → If hiring employees, register for employment taxes.  
    
        8️⃣ Get Business Insurance (Optional but Recommended)  
        - Liability Insurance → Protects against lawsuits.  
        - Workers' Compensation → Required if you have employees.  
        - Property Insurance → Covers business assets.  
    
        ✅ Once registered, you are legally ready to operate, secure funding, and scale! 🎉`
    },
    
    {
        keywords: ["build a brand", "branding strategy", "create a brand", "business branding", "brand identity"],
        answer: `Building a strong brand helps you stand out, attract customers, and establish trust. Follow these steps:
    
        1️⃣ Define Your Brand Identity  
        - What is your mission, vision, and values?  
        - What emotions do you want your brand to evoke?  
        - Identify your Unique Selling Proposition (USP)—what makes you different?  
    
        2️⃣ Choose a Business Name & Logo  
        - Your name should be memorable, easy to spell, and relevant to your industry.  
        - Check domain availability (e.g., using Namecheap or GoDaddy).  
        - Design a professional logo using tools like Canva, Looka, or 99designs.  
    
        3️⃣ Create a Website  
        - A website is your online storefront. Choose:  
          📌 Wix / Squarespace (for easy, no-code solutions).  
          📌 WordPress (for full control & SEO benefits).  
          📌 Shopify (if running an e-commerce store).  
        - Your website should have:  
          ✅ A clear homepage explaining what you do.  
          ✅ A services/products page showcasing what you offer.  
          ✅ A contact page for inquiries.  
          ✅ A blog (optional) to boost SEO and provide value.  
    
        4️⃣ Establish a Social Media Presence  
        - Pick platforms based on your audience:  
          📌 Instagram & TikTok → For visual-heavy businesses (fashion, beauty, art).  
          📌 LinkedIn → For B2B and professional services.  
          📌 Facebook & Twitter (X) → For community building & customer service.  
        - Post engaging content: Behind-the-scenes, testimonials, industry insights.  
    
        5️⃣ Develop a Brand Voice & Messaging  
        - Is your brand friendly, professional, humorous, or authoritative?  
        - Keep a consistent tone across your website, emails, and social media.  
    
        6️⃣ Design Branded Marketing Materials  
        - Business cards, email signatures, brochures, and social media templates.  
        - Use tools like Canva, Adobe Spark, or Figma.  
    
        7️⃣ Build Trust with Customer Engagement  
        - Respond to comments & messages promptly.  
        - Use email marketing (Mailchimp, ConvertKit) to stay in touch.  
        - Gather customer testimonials and feature them on your site.  
    
        💡 Branding is more than visuals—it's the emotional connection you create with your audience.`
    },
    {
        keywords: ["develop a product", "create a service", "product development", "business product", "market fit"],
        answer: `Developing a product or service requires careful planning to ensure quality and market fit. Follow these steps:
    
        1️⃣ Identify Market Needs & Problems  
        - What problem does your product/service solve?  
        - Conduct surveys and interviews with potential customers.  
        - Use market research tools like Google Trends, Statista, and industry reports.  
    
        2️⃣ Define Your Unique Selling Proposition (USP)  
        - What makes your product different & better than competitors?  
        - Examples:  
          ✅ Faster (e.g., Express shipping vs. standard delivery).  
          ✅ Cheaper (e.g., Affordable luxury items).  
          ✅ More innovative (e.g., AI-powered tools).  
    
        3️⃣ Build a Minimum Viable Product (MVP)  
        - An MVP is a simplified version of your product with core features.  
        - Test the concept without large investments.  
        - Example: If launching an app, start with a basic prototype.  
    
        4️⃣ Test & Gather Customer Feedback  
        - Release your product to a small group (beta testers).  
        - Use feedback to fix bugs, improve features, and validate demand.  
        - Platforms for feedback: Reddit, Product Hunt, or social media groups.  
    
        5️⃣ Ensure Quality & Reliability  
        - Conduct rigorous testing for defects.  
        - Implement quality control (for physical products).  
        - If offering a service, test for customer satisfaction & efficiency.  
    
        6️⃣ Pricing Strategy & Business Model  
        - Choose a pricing model based on:  
          📌 Cost-based pricing (total cost + profit margin).  
          📌 Value-based pricing (what customers are willing to pay).  
          📌 Subscription models (monthly recurring revenue).  
    
        7️⃣ Branding & Packaging (If Physical Product)  
        - Design attractive packaging & branding.  
        - Use eco-friendly or premium packaging for a strong customer experience.  
    
        8️⃣ Scale & Improve Your Product Over Time  
        - Use customer data to add new features or refine services.  
        - Offer loyalty programs or upsells for repeat customers.  
        - Keep innovating to stay ahead of competitors.  
    
        ✅ A well-developed product or service that meets customer needs ensures business success! 🚀`
    },
    
    {
        keywords: ["business launch", "how to market my business", "startup marketing", "attract customers", "digital marketing"],
        answer: `Launching a business requires strategic marketing to attract customers. Follow these steps:
    
        1️⃣ Create a Pre-Launch Marketing Plan  
        - Generate excitement before launch.  
        - Start a waitlist or email list with early-bird offers.  
        - Use social media teasers, countdowns, and sneak peeks.  
    
        2️⃣ Optimize Your Website for Conversions  
        - Your website should be fast, mobile-friendly, and visually appealing.  
        - Include a clear call-to-action (CTA): Buy Now, Book a Call, Sign Up.  
        - Use tools like Google Analytics & Hotjar to track visitor behavior.  
    
        3️⃣ Leverage Social Media Marketing  
        - Pick platforms based on your audience:  
          📌 Instagram & TikTok → Visual content & viral marketing.  
          📌 LinkedIn → B2B networking & professional branding.  
          📌 Facebook & Twitter (X) → Community building & paid ads.  
        - Post engaging content: Behind-the-scenes, customer testimonials, and industry tips.  
    
        4️⃣ Implement SEO & Content Marketing  
        - SEO (Search Engine Optimization) helps customers find you on Google.  
        - Write blogs, FAQs, and guides to rank for relevant business keywords.  
        - Use tools like Yoast SEO, Ahrefs, and SEMrush to optimize content.  
    
        5️⃣ Run Paid Advertising Campaigns (PPC & Social Ads)  
        - Use Facebook Ads, Google Ads, and LinkedIn Ads to target potential customers.  
        - Run retargeting ads for people who visited your website but didn’t convert.  
        - Set a budget for ads and track ROI (Return on Investment).  
    
        6️⃣ Build an Email & SMS Marketing Strategy  
        - Email marketing tools: Mailchimp, ConvertKit, Klaviyo.  
        - Send welcome emails, promotions, and personalized offers.  
        - SMS marketing can increase engagement with exclusive discounts.  
    
        7️⃣ Use Influencer & Affiliate Marketing  
        - Partner with influencers in your niche to promote your brand.  
        - Set up an affiliate program to reward referrals.  
        - Use platforms like Upfluence & Refersion to manage partnerships.  
    
        8️⃣ Create an Effective Sales Funnel  
        - Convert website visitors into paying customers with a step-by-step process:  
          📌 Awareness → Attract visitors via ads & content.  
          📌 Interest → Offer lead magnets (free resources, trials, webinars).  
          📌 Decision → Showcase testimonials, case studies, and product demos.  
          📌 Action → Provide limited-time discounts & easy checkout.  
    
        9️⃣ Track & Optimize Performance  
        - Analyze metrics using Google Analytics, Facebook Pixel, and CRM tools.  
        - Optimize campaigns based on conversion rates and customer feedback.  
    
        ✅ A strong marketing strategy ensures a successful business launch and sustainable growth! 🚀`
    },
    {
        keywords: ["monitor business", "track performance", "improve business", "business analytics", "business optimization"],
        answer: `Running a successful business means constantly tracking performance and making improvements. Follow these steps:
    
        1️⃣ Set Key Performance Indicators (KPIs)  
        - Revenue & Profitability → Are sales increasing over time?  
        - Customer Retention → How many customers return to buy again?  
        - Marketing Performance → Which ads and social media campaigns work best?  
        - Website Metrics → Track bounce rates, conversions, and traffic sources.  
    
        2️⃣ Use Analytics Tools for Insights  
        - Google Analytics → Tracks website visitors & behavior.  
        - Facebook & Instagram Insights → Measures ad and social media engagement.  
        - CRM Software (HubSpot, Salesforce) → Tracks customer interactions & sales.  
        - Heatmaps (Hotjar, Crazy Egg) → Understands user behavior on your website.  
    
        3️⃣ Gather Customer Feedback  
        - Send surveys using Google Forms, Typeform, or SurveyMonkey.  
        - Monitor online reviews on Google My Business, Yelp, Trustpilot.  
        - Analyze social media comments for trends in customer concerns.  
    
        4️⃣ Improve Products & Services Based on Data  
        - Identify what customers love or complain about.  
        - Introduce new features, better pricing, or improved quality.  
        - Use A/B testing to experiment with different strategies.  
    
        5️⃣ Automate Business Processes  
        - Reduce manual tasks with AI chatbots, CRM automation, and workflow tools.  
        - Use Zapier, Make (Integromat), or Microsoft Power Automate to connect apps.  
        - Implement email automation (Mailchimp, Klaviyo) for marketing.  
    
        6️⃣ Keep an Eye on Market Trends & Competitors  
        - Follow industry news, competitor activity, and new technology.  
        - Use tools like Google Trends, SEMrush, and Ahrefs for market research.  
        - Adapt to customer behavior shifts (e.g., new social media trends).  
    
        7️⃣ Optimize Financial Management  
        - Review income, expenses, and cash flow regularly.  
        - Use accounting software like QuickBooks, FreshBooks, or Wave.  
        - Cut unnecessary costs and invest in high-ROI activities.  
    
        8️⃣ Scale Your Business Strategically  
        - Hire additional team members when necessary.  
        - Expand into new markets, products, or locations.  
        - Seek partnerships, investors, or new funding for growth.  
    
        9️⃣ Adapt & Innovate Constantly  
        - Always test new marketing strategies and product updates.  
        - Keep an eye on customer feedback to refine your business.  
        - Stay ahead of competitors by embracing innovation & technology.  
    
        ✅ A business that continuously monitors & improves remains competitive and successful! 🚀`
    },
    {
        keywords: ["executive summary", "business summary", "company overview", "business goals", "what is an executive summary"],
        answer: `An Executive Summary is a brief yet powerful introduction to your business. It should capture the reader’s attention and highlight key points. Follow this structure:
    
        1️⃣ Business Overview  
        - What is your business name and industry?  
        - What products or services do you offer?  
        - Where is your business located?  
    
        Example:  
        "XYZ Tech is a software development company based in New York, specializing in AI-driven business automation tools."  
    
        2️⃣ Mission Statement & Vision  
        - Your mission defines why your business exists.  
        - Your vision describes where you want your business to go.  
    
        Example:  
        "Our mission is to simplify business operations using AI-powered solutions. Our vision is to become a global leader in business automation."  
    
        3️⃣ Business Objectives & Goals  
        - What are your short-term and long-term goals?  
        - Define specific, measurable objectives (e.g., revenue targets, customer acquisition).  
    
        Example:  
        "Our goal is to acquire 10,000 customers within the first two years and expand into international markets."  
    
        4️⃣ Unique Selling Proposition (USP)  
        - What sets your business apart from competitors?  
        - Highlight a key advantage (e.g., innovation, affordability, superior service).  
    
        Example:  
        "Unlike competitors, our AI chatbot learns and adapts in real-time, offering highly personalized responses."  
    
        5️⃣ Target Market & Customer Segments  
        - Who are your ideal customers?  
        - Include demographic details such as age, location, industry, income level.  
    
        Example:  
        "We target small and medium-sized businesses in the e-commerce and service industries looking to automate customer interactions."  
    
        6️⃣ Business Model & Revenue Streams  
        - How does your business make money?  
        - List primary and secondary revenue sources (e.g., subscriptions, one-time sales, ads).  
    
        Example:  
        "We generate revenue through monthly SaaS subscriptions and enterprise AI solutions."  
    
        7️⃣ Financial Highlights  
        - Provide key financial projections (e.g., revenue, profit margins, expected growth).  
        - If seeking investment, mention the funding amount needed.  
    
        Example:  
        "We project $1M in revenue within the first 12 months, with a 40% profit margin. We are seeking $500K in funding for expansion."  
    
        8️⃣ Call to Action (For Investors or Stakeholders)  
        - End with a compelling reason why investors or stakeholders should get involved.  
    
        Example:  
        "With a fast-growing AI market and an innovative solution, investing in XYZ Tech presents a unique opportunity for significant returns."  
    
        ✅ A well-written Executive Summary grabs attention and creates interest in your business! 🚀`
    },
    
    {
        keywords: ["business description", "describe my business", "what my business does", "business niche", "business mission"],
        answer: `A Business Description outlines what your company does, the industry it operates in, and its purpose. Follow these key steps:
    
        1️⃣ Company Overview  
        - What is your business name?  
        - What industry are you in (e.g., tech, retail, finance, healthcare)?  
        - Where is your business located?  
        - Are you a local, national, or international business?  
    
        Example:  
        "EcoFresh is a sustainable e-commerce company that sells eco-friendly home products across the U.S."  
    
        2️⃣ Define Your Niche & Target Audience  
        - What specific problem does your business solve?  
        - Who are your ideal customers (age, profession, interests)?  
        - How does your business stand out from competitors?  
    
        Example:  
        "We focus on providing zero-waste kitchenware for environmentally conscious consumers."  
    
        3️⃣ State Your Business Mission  
        - Your mission statement should be clear, concise, and impactful.  
        - Answer: Why does your business exist?  
    
        Example:  
        "Our mission is to reduce plastic waste by offering sustainable alternatives for everyday household products."  
    
        4️⃣ List Your Products & Services  
        - What are the core products or services you offer?  
        - Briefly explain how they benefit customers.  
    
        Example:  
        "EcoFresh offers biodegradable plates, bamboo cutlery, and compostable packaging to make sustainable living easy."  
    
        5️⃣ Business Model & Revenue Strategy  
        - How does your company make money? (e.g., direct sales, subscriptions, licensing, advertising)  
        - Are you B2B (Business-to-Business) or B2C (Business-to-Consumer)?  
    
        Example:  
        "We operate on a B2C e-commerce model, selling directly to consumers via our online store and subscription boxes."  
    
        6️⃣ Competitive Advantage  
        - What makes your business unique?  
        - Why should customers choose you over competitors?  
    
        Example:  
        "Unlike other eco-friendly brands, EcoFresh ensures 100% compostability with a zero-carbon supply chain."  
    
        ✅ A strong Business Description establishes credibility and attracts customers & investors! 🚀`
    },
    {
        keywords: ["revenue model", "pricing strategy", "business income", "how to make money", "revenue streams", "cost structure"],
        answer: `A strong Revenue Model defines how your business earns money, covers costs, and remains profitable. Follow these key steps:
    
        1️⃣ Identify Your Revenue Streams  
        - What are the primary ways your business generates income?  
        - Common revenue streams include:  
          📌 Direct Sales – Selling products or services at a fixed price.  
          📌 Subscription Model – Charging recurring fees (monthly/yearly).  
          📌 Freemium Model – Offering free services with premium upgrades.  
          📌 Affiliate Marketing – Earning commissions by promoting third-party products.  
          📌 Advertising Revenue – Monetizing traffic through ads (Google Ads, YouTube).  
          📌 Licensing Fees – Selling the rights to use a product or technology.  
          📌 Commission-Based Sales – Taking a percentage of each transaction (marketplaces, brokers).  
    
        Example:  
        "Our SaaS platform operates on a subscription model with three pricing tiers: Basic ($9.99), Pro ($29.99), and Enterprise ($99.99 per month)."  
    
        2️⃣ Develop a Pricing Strategy  
        - How do you determine how much to charge for your product/service?  
        - Consider:  
          📌 Cost-Plus Pricing → Setting a price based on production costs + profit margin.  
          📌 Value-Based Pricing → Charging based on perceived value to the customer.  
          📌 Competitive Pricing → Setting prices similar to or lower than competitors.  
          📌 Dynamic Pricing → Adjusting prices based on demand (e.g., Uber surge pricing).  
          📌 Penetration Pricing → Starting with low prices to gain market share, then increasing.  
    
        Example:  
        "We use a value-based pricing strategy, charging $49/month for access to premium business automation tools that save companies hours of manual work."  
    
        3️⃣ Define Your Cost Structure  
        - What are your fixed and variable costs?  
        - Fixed Costs (don’t change with sales volume):  
          📌 Rent, salaries, software subscriptions, marketing.  
        - Variable Costs (change based on production/sales volume):  
          📌 Raw materials, shipping, transaction fees, customer support.  
    
        Example:  
        "Our primary fixed costs include cloud hosting ($1,000/month), software licenses ($500/month), and marketing expenses ($2,000/month)."  
    
        4️⃣ Calculate Your Profit Margins  
        - Profit = Revenue – Expenses  
        - Gross Margin: Revenue minus the cost of goods sold (COGS).  
        - Net Profit Margin: Final earnings after all expenses.  
        - Set a break-even point → How many sales are needed to cover costs?  
    
        Example:  
        "With a gross profit margin of 70% and a net profit margin of 25%, we expect to reach our break-even point after 1,000 subscriptions."  
    
        5️⃣ Scale & Optimize Revenue  
        - Test different pricing models to see what works best.  
        - Expand revenue streams (e.g., add consulting services, digital products).  
        - Automate sales processes to reduce costs and maximize profit.  
    
        ✅ A strong Revenue Model ensures sustainable business growth and profitability! 🚀`
    },
    {
        keywords: ["marketing strategy", "sales strategy", "customer acquisition", "how to attract customers", "grow my business", "increase sales"],
        answer: `A strong Marketing & Sales Strategy helps businesses attract customers, boost revenue, and build brand loyalty. Follow these steps:
    
        1️⃣ Define Your Target Audience  
        - Who are your ideal customers?  
        - Consider demographics like age, gender, location, income, and interests.  
        - Use tools like Google Analytics, Facebook Insights, or customer surveys to understand your audience.  
    
        Example:  
        "Our target audience is small business owners aged 25-45 who need AI automation tools to streamline their workflow."  
    
        2️⃣ Build a Strong Online Presence  
        - Develop a professional website optimized for search engines (SEO).  
        - Set up social media profiles (Facebook, LinkedIn, Instagram, TikTok, Twitter).  
        - Create engaging content (blogs, videos, infographics) to attract visitors.  
    
        Example:  
        "We post weekly blog articles on business automation and share success stories on LinkedIn to build credibility."  
    
        3️⃣ Use Paid Advertising (PPC & Social Ads)  
        - Run Google Ads to capture customers searching for your product.  
        - Use Facebook & Instagram Ads to target potential buyers based on interests.  
        - Retarget visitors with Pixel tracking & remarketing ads.  
    
        Example:  
        "We invest $500/month in Facebook ads targeting small business owners, generating an average of 1,000 website visitors per campaign."  
    
        4️⃣ Leverage Email & SMS Marketing  
        - Capture leads through email sign-up forms and offer free resources (ebooks, webinars).  
        - Send automated email sequences to educate and convert leads.  
        - Use SMS marketing for exclusive deals and reminders.  
    
        Example:  
        "Our email campaign converts 15% of leads into customers by offering free trials and case studies."  
    
        5️⃣ Build Partnerships & Referral Programs  
        - Partner with influencers, industry leaders, or complementary businesses.  
        - Offer referral bonuses for word-of-mouth marketing.  
    
        Example:  
        "We collaborate with business coaches who promote our AI tools to their clients, offering them a 20% commission per sale."  
    
        6️⃣ Optimize Your Sales Funnel  
        - Create a clear customer journey from discovery to purchase.  
        - Offer a free trial or demo to build trust.  
        - Use chatbots and AI assistants to engage leads in real-time.  
    
        Example:  
        "Visitors who sign up for a free trial receive an automated onboarding sequence with video tutorials and a follow-up call from our sales team."  
    
        7️⃣ Retain Customers with Loyalty Programs  
        - Offer discounts, exclusive content, or premium support for repeat buyers.  
        - Use CRM tools like HubSpot or Salesforce to track customer interactions.  
        - Provide exceptional customer service to increase retention.  
    
        Example:  
        "Customers who subscribe for more than 6 months receive a 10% lifetime discount and priority customer support."  
    
        ✅ A well-structured Marketing & Sales Strategy ensures long-term business growth! 🚀`
    },
    {
        keywords: ["operational plan", "business operations", "daily operations", "supply chain", "logistics", "business processes"],
        answer: `An Operational Plan details the daily processes that keep your business running smoothly. Follow these steps:
    
        1️⃣ Define Your Business Operations  
        - What are the core activities your business performs daily?  
        - What are your key resources (staff, equipment, technology)?  
        - Do you have a physical location, online presence, or both?  
    
        Example:  
        "Our e-commerce business manages online sales, warehouse inventory, and customer support operations daily."  
    
        2️⃣ Supply Chain & Suppliers  
        - Who are your key suppliers or manufacturers?  
        - How do you source raw materials or products?  
        - Do you use local, national, or international suppliers?  
    
        Example:  
        "We source sustainable packaging from China and manufacture products locally to ensure quality control and faster delivery."  
    
        3️⃣ Inventory & Logistics Management  
        - How do you store, track, and manage inventory?  
        - What logistics or shipping providers do you use (FedEx, UPS, DHL, etc.)?  
        - Do you use dropshipping, warehousing, or just-in-time inventory systems?  
    
        Example:  
        "We use Shopify’s inventory management system and partner with UPS for international shipping."  
    
        4️⃣ Technology & Automation  
        - What software or automation tools do you use for efficiency?  
        - Do you use CRM, ERP, AI, or chatbots?  
    
        Example:  
        "Our AI chatbot handles customer inquiries, while our CRM (HubSpot) tracks sales and automates follow-ups."  
    
        5️⃣ Staffing & Workforce  
        - What roles do you need to run daily operations smoothly?  
        - How many employees, contractors, or freelancers do you have?  
        - Do you offer remote or in-office work?  
    
        Example:  
        "We have 10 full-time employees handling customer service, marketing, and fulfillment, plus remote freelancers for content creation."  
    
        6️⃣ Compliance & Risk Management  
        - What legal or regulatory requirements apply to your business?  
        - How do you handle risk management, quality control, and security?  
    
        Example:  
        "We comply with GDPR for customer data protection and follow strict quality control processes before shipping products."  
    
        ✅ A strong Operational Plan ensures efficiency, reliability, and long-term success! 🚀`
    },
    {
        keywords: ["financial projections", "sales forecast", "profit and loss", "business finances", "funding requirements"],
        answer: `A solid Financial Projection includes sales forecasts, profit and loss statements, and funding requirements. Follow these steps:
    
        1️⃣ Project Your Revenue (Sales Forecast)  
        - Estimate how much revenue your business will generate monthly or annually.  
        - Use historical data (if available) or industry benchmarks.  
        - Consider: Market demand, competition, pricing strategy, and customer growth rate.  
    
        Example:  
        "Our sales projections show a growth rate of 20% per quarter, reaching $500,000 in revenue by the end of year one."  
    
        2️⃣ Estimate Costs & Expenses  
        - Fixed Costs: Rent, salaries, software subscriptions, insurance.  
        - Variable Costs: Raw materials, shipping, payment processing fees.  
        - One-Time Costs: Equipment purchases, website development, branding.  
    
        Example:  
        "Our estimated monthly expenses are $10,000, including $3,000 in salaries and $2,000 in marketing costs."  
    
        3️⃣ Calculate Your Break-Even Point  
        - Determine when your business will start making a profit.  
        - Formula: Break-even Point = Fixed Costs ÷ (Price per Unit - Variable Costs per Unit).  
    
        Example:  
        "We need to sell 2,000 units per month at $50 each to break even in six months."  
    
        4️⃣ Create a Profit & Loss (P&L) Statement  
        - Revenue – Sales income.  
        - Cost of Goods Sold (COGS) – Direct costs of production.  
        - Gross Profit = Revenue - COGS.  
        - Operating Expenses – Rent, payroll, advertising.  
        - Net Profit = Gross Profit - Expenses.  
    
        Example:  
        "Projected P&L for Q1: Revenue = $150,000, COGS = $50,000, Gross Profit = $100,000, Expenses = $70,000, Net Profit = $30,000."  
    
        5️⃣ Funding Requirements & Investment Plan  
        - How much funding do you need to start or grow your business?  
        - Consider: Personal savings, venture capital, angel investors, bank loans, crowdfunding.  
        - Explain how funds will be used (e.g., marketing, R&D, product development).  
    
        Example:  
        "We seek $250,000 in funding to expand marketing and scale production, expecting a 3x return within two years."  
    
        ✅ A clear Financial Projection attracts investors and ensures long-term profitability! 🚀`
    },
    {
        keywords: ["funding plan", "raise capital", "business funding", "investors", "loans", "grants"],
        answer: `A Funding Plan helps businesses secure capital to start or expand. Follow these steps:
    
        1️⃣ Determine How Much Capital You Need  
        - Estimate startup costs (equipment, inventory, software, rent).  
        - Calculate operational expenses (payroll, marketing, legal fees).  
        - Plan for growth investments (scaling, new product development).  
    
        Example:  
        "Our business requires $250,000 to cover initial development, marketing, and hiring key personnel."  
    
        2️⃣ Identify Your Funding Sources  
        - Bootstrapping → Using personal savings or reinvesting profits.  
        - Angel Investors → Individuals investing in early-stage startups.  
        - Venture Capital (VC) → Firms funding high-growth businesses.  
        - Business Loans → Traditional or government-backed bank loans.  
        - Grants & Competitions → Non-repayable funding from organizations.  
        - Crowdfunding → Raising money from many small investors (Kickstarter, GoFundMe).  
    
        Example:  
        "We plan to raise $100,000 from angel investors and apply for a $50,000 government grant."  
    
        3️⃣ Create a Pitch for Investors  
        - Clearly explain your business model, market opportunity, and revenue potential.  
        - Highlight why investors should fund your business (scalability, competitive advantage).  
        - Prepare a financial forecast & exit strategy (how investors get returns).  
    
        Example:  
        "Our pitch deck includes revenue projections showing 5X growth in two years, making us an attractive investment opportunity."  
    
        4️⃣ Understand Loan & Grant Requirements  
        - Bank Loans: Requires credit checks, collateral, and repayment plans.  
        - Government Grants: May require meeting specific business criteria.  
        - Alternative Financing: Consider revenue-based financing, business credit lines.  
    
        Example:  
        "We secured a $50,000 business loan with a 5-year repayment term at 6% interest."  
    
        5️⃣ Build Financial Sustainability  
        - Keep overhead costs low to maintain profitability.  
        - Focus on customer acquisition & revenue growth to avoid over-reliance on funding.  
        - Secure multiple funding streams for long-term stability.  
    
        ✅ A well-planned funding strategy ensures business success & financial growth! 🚀`
    },
    
];

app.post("/subscribe", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required." });
    }

    try {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER, // Your business email
                pass: process.env.EMAIL_PASS, // App password
            },
        });

        // ✅ Email to Admin (Notification)
        let adminMailOptions = {
            from: `"LegacyBots Newsletter" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Admin's email
            subject: "📢 New Newsletter Subscriber",
            text: `New Subscriber Email: ${email}`,
        };

        // ✅ Welcome Email to Subscriber
        let subscriberMailOptions = {
            from: `"LegacyBots" <${process.env.EMAIL_USER}>`,
            to: email, // Send to subscriber
            subject: "🎉 Welcome to LegacyBots Newsletter!",
            text: `Hello,\n\nThank you for subscribing to LegacyBots! You'll receive updates on AI trends, automation, and exclusive offers.\n\nStay tuned!\n\nBest regards,\nThe LegacyBots Team\n📧 Text +1 940 503 2012`,
        };

        // ✅ Send both emails
        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail(subscriberMailOptions);

        res.json({ success: true, message: "✅ Subscription successful!" });

    } catch (error) {
        console.error("❌ Subscription error:", error);
        res.status(500).json({ success: false, message: "❌ Subscription failed." });
    }
});

// ✅ Email Route for Contact Form
app.post("/send-email", async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    try {
        let transporter = nodemailer.createTransport({
            service: "gmail", // Change if using a different provider
            auth: {
                user: process.env.EMAIL_USER, // Business email (admin)
                pass: process.env.EMAIL_PASS, // App password
            },
        });

        // ✅ Email to Business Owner
        let ownerMailOptions = {
            from: `"${name}" <${email}>`,
            to: process.env.EMAIL_USER, // Your business email
            subject: `📩 New Contact Form Message: ${subject}`,
            text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
        };

        // ✅ Confirmation Email to Sender
        let senderMailOptions = {
            from: `"LegacyBots Support" <${process.env.EMAIL_USER}>`,
            to: email, // Send to the user's email
            subject: "✅ We Received Your Message - LegacyBots",
            text: `Hello ${name},\n\nThank you for reaching out to LegacyBots! We have received your message and will get back to you shortly.\n\n📝 Your Message:\n"${message}"\n\nBest regards,\nThe LegacyBots Team\n📧 Text +1 940 503 2012`,
        };

        // ✅ Send both emails
        await transporter.sendMail(ownerMailOptions);
        await transporter.sendMail(senderMailOptions);

        res.json({ success: true, message: "✅ Emails sent successfully!" });

    } catch (error) {
        console.error("❌ Email sending error:", error);
        res.status(500).json({ success: false, message: "❌ Error sending email." });
    }
});

// ✅ Chatbot Route: Identifies Business Keywords & Replies
app.post("/chat", (req, res) => {
    try {
        const userMessage = req.body.message.trim().toLowerCase();
        console.log("User Message:", userMessage);

        let bestMatch = null;
        let highestMatchCount = 0;

        // ✅ Find the best response based on keyword matching
        responses.forEach(item => {
            let matchCount = 0;
            item.keywords.forEach(keyword => {
                if (userMessage.includes(keyword)) {
                    matchCount++;
                }
            });

            if (matchCount > highestMatchCount) {
                highestMatchCount = matchCount;
                bestMatch = item.answer;
            }
        });

        // ✅ If a match is found, send response. Otherwise, default reply.
        res.json({ response: bestMatch || "I specialize in business topics. Can you ask me something related to business?" });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ response: "Oops! Something went wrong. Try again." });
    }
});

// Handle user chat messages
app.post("/chatbot", async (req, res) => {
    const { userEmail, userName, message } = req.body;

    if (!userEmail || !userName || !message) {
        return res.status(400).json({ reply: "⚠️ Missing user data" });
    }

    const botReply = responses[message.toLowerCase()] || responses["default"];

    // Save chat to database
    let chat = await Chat.findOne({ userEmail });
    if (!chat) {
        chat = new Chat({ userEmail, userName, messages: [] });
    }

    chat.messages.push({ sender: userName, text: message, timestamp: new Date() });
    chat.messages.push({ sender: "Bot", text: botReply, timestamp: new Date() });
    await chat.save();

    res.json({ reply: botReply });
});

// Get chat history for a user
app.post("/getChatHistory", async (req, res) => {
    const { userEmail } = req.body;

    if (!userEmail) {
        return res.status(400).json({ error: "⚠️ Missing user ID" });
    }

    const chat = await Chat.findOne({ userEmail });
    res.json({ chatHistory: chat ? chat.messages : [] });
});


const BotSchema = new mongoose.Schema({
    userEmail: String, 
    name: String,
    desc: String,
    conversations: Array,
    badgeColor: String,
    badgePosition: String,
    suspended: { type: Boolean, default: false }  // Suspension status
});

const Bot = mongoose.model("Bot", BotSchema);


// Middleware to check authentication
function checkAuth(req, res, next) {
    const { userEmail } = req.body;
    if (!userEmail) {
        return res.status(401).json({ success: false, message: "Unauthorized: User not logged in." });
    }
    next();
}

// Save a bot (Only logged-in users)
// Save a bot (Only logged-in users)
app.post("/save-bot", async (req, res) => {
    const { userEmail, name, desc, conversations, badgeColor, badgePosition } = req.body;

    let bot = new Bot({ userEmail, name, desc, conversations, badgeColor, badgePosition });
    await bot.save();
    
    res.json({ success: true, botId: bot._id }); // Return the bot ID
});


// Get user's saved bots (Only logged-in users)
app.post("/get-user-bots", checkAuth, async (req, res) => {
    const { userEmail } = req.body;
    
    let bots = await Bot.find({ userEmail });
    res.json({ success: true, bots });
});

// Get a specific bot by ID
// Get a specific bot and its conversations
app.get("/get-bot/:id", async (req, res) => {
    let bot = await Bot.findById(req.params.id);
    if (!bot) {
        return res.status(404).json({ success: false, message: "Bot not found." });
    }
    res.json({ success: true, bot });
});

// Save a bot's conversation update
app.put("/add-conversation/:id", async (req, res) => {
    let bot = await Bot.findById(req.params.id);
    if (!bot) {
        return res.status(404).json({ success: false, message: "Bot not found." });
    }

    let { question, response } = req.body;
    if (!question || !response) {
        return res.status(400).json({ success: false, message: "Missing question or response." });
    }

    bot.conversations.push({ question, response });
    await bot.save();

    res.json({ success: true, message: "Conversation added successfully." });
});

// Delete a bot
app.delete("/delete-bot/:id", async (req, res) => {
    let bot = await Bot.findByIdAndDelete(req.params.id);
    if (!bot) {
        return res.status(404).json({ success: false, message: "Bot not found." });
    }
    res.json({ success: true });
});


// Delete a specific conversation from a bot
app.put("/delete-conversation/:id", async (req, res) => {
    let { question } = req.body;

    if (!question) {
        return res.status(400).json({ success: false, message: "Missing question." });
    }

    let bot = await Bot.findById(req.params.id);
    if (!bot) {
        return res.status(404).json({ success: false, message: "Bot not found." });
    }

    // Filter out the deleted conversation
    bot.conversations = bot.conversations.filter(conv => conv.question !== question);
    await bot.save();

    res.json({ success: true });
});





// Admin: Get all bots
// Get all bots for admin
app.get("/get-all-bots", async (req, res) => {
    try {
        let bots = await Bot.find();
        res.json({ success: true, bots });
    } catch (error) {
        console.error("❌ Error fetching bots:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
});



// Admin: Toggle bot suspension status
app.put("/admin/toggle-bot-status", async (req, res) => {
    let { botId } = req.body;
    let bot = await Bot.findById(botId);
    if (!bot) {
        return res.status(404).json({ success: false, message: "Bot not found." });
    }

    bot.suspended = !bot.suspended;
    await bot.save();
    res.json({ success: true });
});

  
app.post('/chat/:botId', async (req, res) => {
    try {
        const { userMessage } = req.body;
        const bot = await Bot.findById(req.params.botId);
        if (!bot) return res.status(404).send('Bot not found');

        let botResponse = "I'm not sure I understand.";
        
        // Check if the bot has a pre-set response for the message
        for (const [key, value] of Object.entries(bot.responses || {})) {
            if (userMessage.toLowerCase().includes(key.toLowerCase())) {
                botResponse = value;
                break;
            }
        }

        // Save conversation to database
        bot.conversations.push({ userMessage, botResponse });
        await bot.save();

        res.json({ botResponse });

    } catch (error) {
        console.error("Chat error:", error);
        res.status(500).send("Server error");
    }
});

app.get('/chat-history/:botId', async (req, res) => {
    try {
        const bot = await Bot.findById(req.params.botId);
        if (!bot) return res.status(404).send('Bot not found');
        
        res.json(bot.conversations);
    } catch (error) {
        console.error("Fetch history error:", error);
        res.status(500).send("Server error");
    }
});
// Get the chatbot script for embedding
app.get("/get-bot-script/:id", async (req, res) => {
    let bot = await Bot.findById(req.params.id);
    if (!bot) return res.status(404).send("Bot not found.");

    // 🔴 Prevent the bot from loading if it is suspended
    if (bot.suspended) {
        return res.status(403).send("// 🔴 This bot has been suspended by the admin.");
    }

    let chatbotCode = `
        (function() {
            document.addEventListener("DOMContentLoaded", function() {
                let chatButton = document.createElement("button");
                chatButton.innerText = "💬 Chat";
                chatButton.style.cssText = "position:fixed; bottom:20px; ${bot.badgePosition}:20px; background:${bot.badgeColor}; color:white; padding:12px 20px; border:none; border-radius:50px; cursor:pointer; font-size:16px; transition:0.3s ease;";
                chatButton.onmouseover = () => chatButton.style.transform = "scale(1.1)";
                chatButton.onmouseout = () => chatButton.style.transform = "scale(1)";
                chatButton.onclick = openChat;
                document.body.appendChild(chatButton);

                function openChat() {
                    let chatPopup = document.getElementById('chatPopup');
                    if (!chatPopup) {
                        chatPopup = document.createElement('div');
                        chatPopup.id = 'chatPopup';
                        chatPopup.style.cssText = "position:fixed; bottom:-450px; right:20px; width:320px; height:400px; background:white; box-shadow:0 0 15px rgba(0,0,0,0.3); border-radius:12px; padding:15px; overflow:hidden; opacity:0; transform:scale(0.9); transition:all 0.4s ease-in-out; font-family:sans-serif;";
                        
                        chatPopup.innerHTML = \`
                            <div style="display:flex; justify-content:space-between; align-items:center; background:${bot.badgeColor}; color:white; padding:10px; border-radius:10px 10px 0 0;">
                                <h3 style="margin:0; font-size:16px;">${bot.name}</h3>
                                <button id="closeChatBtn" onclick="closeChat()" style="background:none; border:none; color:white; font-size:18px; cursor:pointer;">❌</button>
                            </div>
                            <p style="color:#666; font-size:14px; margin:10px 0;">${bot.desc}</p>
                            <div id="chatMessages" style="height:250px; overflow-y:auto; padding:10px; border:1px solid #ddd; border-radius:5px; background:#f9f9f9;"></div>
                            <div style="display:flex; margin-top:10px;">
                                <input type="text" id="chatInput" placeholder="Type a message..." style="flex:1; padding:8px; border:1px solid #ddd; border-radius:5px; font-size:14px; outline:none;">
                                <button onclick="sendMessage()" style="margin-left:5px; padding:8px 15px; background:${bot.badgeColor}; color:white; border:none; border-radius:5px; cursor:pointer; font-size:14px;">Send</button>
                            </div>
                        \`;

                        document.body.appendChild(chatPopup);
                        setTimeout(() => {
                            chatPopup.style.bottom = "20px";
                            chatPopup.style.opacity = "1";
                            chatPopup.style.transform = "scale(1)";
                            loadChatHistory();
                        }, 100);
                    }

                    // Make the close button shake every 5 seconds
                    let closeBtn = document.getElementById("closeChatBtn");
                    setInterval(() => {
                        closeBtn.style.animation = "shake 0.5s ease";
                        setTimeout(() => closeBtn.style.animation = "", 500);
                    }, 5000);
                }

                function closeChat() {
                    let chatPopup = document.getElementById('chatPopup');
                    if (chatPopup) {
                        chatPopup.style.bottom = "-450px";
                        chatPopup.style.opacity = "0";
                        chatPopup.style.transform = "scale(0.9)";
                        setTimeout(() => chatPopup.remove(), 400);
                    }
                }

                function sendMessage() {
                    let input = document.getElementById("chatInput");
                    let message = input.value.trim();
                    if (message === "") return;

                    let chatMessages = document.getElementById("chatMessages");
                    chatMessages.innerHTML += "<div style='background:#ff6600; color:white; padding:8px; margin:5px; border-radius:5px; align-self:flex-end; max-width:80%; font-size:14px;'><strong>You:</strong> " + message + "</div>";

                    let botResponse = "I'm not sure I understand.";
                    let conversations = ${JSON.stringify(bot.conversations)};

                    conversations.forEach(conv => {
                        if (message.toLowerCase() === conv.question.toLowerCase()) {
                            botResponse = conv.response;
                        }
                    });

                    setTimeout(() => {
                        chatMessages.innerHTML += "<div style='background:#ddd; padding:8px; margin:5px; border-radius:5px; align-self:flex-start; max-width:80%; font-size:14px;'><strong>${bot.name}:</strong> " + botResponse + "</div>";
                        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to latest message
                        saveChatHistory();
                    }, 800);

                    input.value = "";
                }

                function saveChatHistory() {
                    let chatMessages = document.getElementById("chatMessages").innerHTML;
                    localStorage.setItem("chatHistory", chatMessages);
                }

                function loadChatHistory() {
                    let chatMessages = document.getElementById("chatMessages");
                    let savedHistory = localStorage.getItem("chatHistory");
                    if (savedHistory) {
                        chatMessages.innerHTML = savedHistory;
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                }

                // CSS for shaking close button
                let styleSheet = document.createElement("style");
                styleSheet.type = "text/css";
                styleSheet.innerText = \`
                    @keyframes shake {
                        0% { transform: translateX(0); }
                        25% { transform: translateX(-3px); }
                        50% { transform: translateX(3px); }
                        75% { transform: translateX(-3px); }
                        100% { transform: translateX(0); }
                    }
                \`;
                document.head.appendChild(styleSheet);

                window.openChat = openChat;
                window.closeChat = closeChat;
                window.sendMessage = sendMessage;
            });
        })();
    `;

    res.setHeader("Content-Type", "application/javascript");
    res.send(chatbotCode);
});


// Admin suspends a bot
app.put("/admin/suspend-bot/:id", async (req, res) => {
    let bot = await Bot.findById(req.params.id);
    if (!bot) return res.status(404).json({ success: false, message: "Bot not found." });

    bot.suspended = true; // 🔴 Mark bot as suspended
    await bot.save();

    res.json({ success: true, message: "Bot has been suspended." });
});

// Admin unsuspends a bot
app.put("/admin/unsuspend-bot/:id", async (req, res) => {
    let bot = await Bot.findById(req.params.id);
    if (!bot) return res.status(404).json({ success: false, message: "Bot not found." });

    bot.suspended = false; // 🟢 Mark bot as active
    await bot.save();

    res.json({ success: true, message: "Bot has been unsuspended." });
});

// Get bots by user email
app.get("/get-bots-by-email/:email", async (req, res) => {
    try {
        let userEmail = req.params.email;
        let bots = await Bot.find({ userEmail });

        if (bots.length === 0) {
            return res.json({ success: false, message: "No bots found for this email." });
        }

        res.json({ success: true, bots });
    } catch (error) {
        console.error("❌ Error fetching bots:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
