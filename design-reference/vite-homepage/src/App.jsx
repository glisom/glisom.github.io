import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Asterisk,
  Books,
  Code,
  DeviceMobile,
  EnvelopeSimple,
  GithubLogo,
  LinkedinLogo,
  PenNib,
  Robot,
  Rss,
  StackSimple,
} from "@phosphor-icons/react";

const navItems = [
  ["Blog", "blog"],
  ["App Library", "app-library"],
  ["My Apps", "my-apps"],
  ["Skill Library", "skill-library"],
  ["My Skills", "my-skills"],
];

const socialLinks = [
  { label: "GitHub", href: "https://github.com/glisom", icon: GithubLogo },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/grantisom",
    icon: LinkedinLogo,
  },
  { label: "RSS", href: "https://grantisom.com/feed.xml", icon: Rss },
  {
    label: "Email",
    href: "mailto:grant.isom@gmail.com?subject=Hello%20from%20grantisom.com",
    icon: EnvelopeSimple,
  },
];

const nowItems = [
  { eyebrow: "Writing", title: "Notes from the workbench", icon: PenNib },
  {
    eyebrow: "Building",
    title: "Hermes iOS",
    icon: DeviceMobile,
  },
  { eyebrow: "Using", title: "Obsidian + Codex", icon: StackSimple },
];

const appLibrary = [
  { number: "01", label: "Obsidian", icon: Books, href: "https://obsidian.md" },
  { number: "02", label: "Codex", icon: Code, href: "https://openai.com/codex/" },
  {
    number: "03",
    label: "Hermes",
    icon: Robot,
    href: "https://github.com/NousResearch/hermes-agent",
  },
  {
    number: "04",
    label: "Superhuman",
    icon: EnvelopeSimple,
    href: "https://superhuman.com",
  },
];

function ArrowLink({ href, children, className = "", external = true }) {
  return (
    <a
      className={`arrow-link ${className}`}
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      <span>{children}</span>
      <ArrowRight aria-hidden="true" weight="bold" />
    </a>
  );
}

function SocialLink({ link }) {
  const Icon = link.icon;

  return (
    <a
      className="social-link"
      href={link.href}
      aria-label={link.label}
      title={link.label}
      {...(!link.href.startsWith("mailto:")
        ? { target: "_blank", rel: "noreferrer" }
        : {})}
    >
      <Icon aria-hidden="true" />
    </a>
  );
}

function NowItem({ item }) {
  const Icon = item.icon;

  return (
    <div className="role-item">
      <Icon aria-hidden="true" weight="duotone" />
      <div>
        <p className="role-eyebrow">{item.eyebrow}</p>
        <p className="role-title">{item.title}</p>
      </div>
    </div>
  );
}

export function App() {
  const [activeSection, setActiveSection] = useState("blog");

  useEffect(() => {
    const syncHash = () => {
      const section = window.location.hash.replace("#", "");
      if (navItems.some(([, id]) => id === section)) setActiveSection(section);
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return (
    <div className="site-shell">
      <aside className="sidebar" aria-label="Site navigation">
        <a className="identity" href="#top" aria-label="Grant Isom, home">
          <span className="monogram" aria-hidden="true">GI</span>
          <span className="identity-copy">
            <strong>Grant Isom</strong>
            <small>Writer · maker · tinkerer</small>
          </span>
        </a>

        <div className="status-line">
          <span className="status-dot" aria-hidden="true" />
          <span>Currently building Hermes iOS</span>
        </div>

        <nav className="side-nav" aria-label="Browse">
          <p className="rail-label">Browse</p>
          {navItems.map(([label, id]) => (
            <a
              key={id}
              className={activeSection === id ? "active" : ""}
              href={`#${id}`}
              onClick={() => setActiveSection(id)}
              aria-current={activeSection === id ? "location" : undefined}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="rail-bottom">
          <div className="socials" aria-label="Social links">
            {socialLinks.map((link) => (
              <SocialLink key={link.label} link={link} />
            ))}
          </div>
          <p className="updated">Last updated · Sep 2026</p>
        </div>
      </aside>

      <header className="mobile-header">
        <a className="mobile-identity" href="#top">
          <span className="monogram" aria-hidden="true">GI</span>
          <span>Grant Isom</span>
        </a>
        <a className="mobile-contact" href="mailto:grant.isom@gmail.com">Say hello</a>
      </header>

      <main className="main-content" id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <Asterisk aria-hidden="true" weight="bold" />
              Writing · Small software · Useful systems
            </p>
            <h1 id="hero-title">
              <span className="hero-line">I build <em>useful things</em></span>
              <span className="hero-line hero-line-two">
                and write what I learn.
              </span>
            </h1>
            <p className="hero-intro">
              I’m Grant, an app maker, obsessive software user, and writer in Chicago.
              This is where I keep the things I’ve built, the tools I actually use,
              the skills shaping how I work, and the notes I want to remember.
            </p>
            <div className="hero-actions">
              <ArrowLink href="#blog" external={false} className="primary-action">
                Read the blog
              </ArrowLink>
              <ArrowLink href="#my-apps" external={false}>
                See what I’m building
              </ArrowLink>
            </div>
          </div>

          <figure className="hero-visual">
            <img
              src="/assets/evidence-map.png"
              alt="Abstract blue halftone terrain marked with system checkpoints"
            />
            <figcaption>
              <span>Personal rule 01</span>
              Make what you want to use.
            </figcaption>
          </figure>
        </section>

        <section className="role-index" aria-label="What Grant is doing now">
          <p className="rail-label">Right now</p>
          {nowItems.map((item) => (
            <NowItem key={item.eyebrow} item={item} />
          ))}
          <ArrowDown className="role-down" aria-hidden="true" />
        </section>

        <section className="evidence-grid" aria-label="Grant’s personal index">
          <article className="card production-card" id="blog">
            <div className="card-label-row">
              <span className="card-kicker">Featured writing</span>
              <span className="card-number">01</span>
            </div>
            <h2>Bringing ListWithMe Back to Life</h2>
            <p>
              I rebuilt an app I first shipped in 2019 because I missed using it.
              A story about old code, new tools, and making software personal again.
            </p>
            <img
              src="/assets/production-hands.png"
              alt="Two halftone hands reaching toward one another"
            />
            <ArrowLink href="https://grantisom.com/2026/02/24/listwithme-returns.html">
              Read the story
            </ArrowLink>
          </article>

          <article className="card project-card healthql-card" id="my-apps">
            <div className="card-label-row">
              <span className="card-kicker">My Apps · Open source</span>
              <span className="card-number">02</span>
            </div>
            <h2>Hermes iOS</h2>
            <p>My always-on AI agent, in my pocket.</p>
            <img src="/assets/healthql-hands.png" alt="A sequence of fine-line hand gestures" />
            <ArrowLink href="https://github.com/glisom/hermes-ios">View on GitHub</ArrowLink>
          </article>

          <article className="card project-card list-card">
            <div className="card-label-row">
              <span className="card-kicker">My Apps · App Store</span>
              <span className="card-number">03</span>
            </div>
            <h2>ListWithMe</h2>
            <p>Shared lists, rebuilt because I wanted mine back.</p>
            <img src="/assets/listwithme-hand.png" alt="A stippled hand holding a pen" />
            <ArrowLink href="https://apps.apple.com/us/app/listwithme/id1224284271">
              Open in the App Store
            </ArrowLink>
          </article>

          <article className="card method-card" id="app-library">
            <div className="card-label-row">
              <span className="card-kicker">App Library</span>
              <span className="card-number">04</span>
            </div>
            <h2>Daily drivers.</h2>
            <p className="method-intro">The software I would reinstall first.</p>
            <ol className="method-list">
              {appLibrary.map((app) => {
                const Icon = app.icon;
                return (
                  <li key={app.label}>
                    <a href={app.href} target="_blank" rel="noreferrer">
                      <span>{app.number}</span>
                      <Icon aria-hidden="true" weight="duotone" />
                      <strong>{app.label}</strong>
                      <ArrowRight aria-hidden="true" weight="bold" />
                    </a>
                  </li>
                );
              })}
            </ol>
          </article>

          <article className="card writing-card">
            <div className="card-label-row">
              <span className="card-kicker">From the blog</span>
              <span className="card-number">05</span>
            </div>
            <h2>Latest notes.</h2>
            <div className="article-list">
              <a href="https://grantisom.com/2026/02/07/healthql-react-native.html">
                <span><small>Build log</small>HealthQL, rebuilt in React Native</span>
                <ArrowRight aria-hidden="true" weight="bold" />
              </a>
              <a href="https://grantisom.com/2026/02/01/healthql-sql-for-healthkit.html">
                <span><small>Open source</small>HealthQL: SQL for Apple HealthKit</span>
                <ArrowRight aria-hidden="true" weight="bold" />
              </a>
              <a href="https://grantisom.com/2023/07/19/accessibility-testing-in.html">
                <span><small>Testing</small>Accessibility Testing in Maestro</span>
                <ArrowRight aria-hidden="true" weight="bold" />
              </a>
            </div>
            <ArrowLink href="https://grantisom.com/" external={false}>Browse all writing</ArrowLink>
          </article>

          <article className="card beliefs-card" id="my-skills">
            <img src="/assets/belief-rings.png" alt="Concentric lime halftone rings" />
            <div>
              <div className="card-label-row">
                <span className="card-kicker">My Skills</span>
                <span className="card-number">06</span>
              </div>
              <h2>Three skills I made for myself.</h2>
              <p className="personal-skill-list">
                write-like-grant · goodreads-export · hatch-pet
              </p>
            </div>
          </article>

          <article className="card groundwork-card" id="skill-library">
            <div className="groundwork-copy">
              <div className="card-label-row">
                <span className="card-kicker">Skill Library</span>
                <span className="card-number">07</span>
              </div>
              <h2>The skills I reach for.</h2>
              <p>
                Obsidian, Hermes Agent, research-intelligence, xurl, PDF, and more.
                A preview of the capabilities behind my everyday workflows.
              </p>
              <ArrowLink href="https://github.com/NousResearch/hermes-agent">
                Open Hermes Agent
              </ArrowLink>
            </div>
            <img
              src="/assets/groundwork-surveyor.png"
              alt="A technical blue drawing of a surveyor’s level"
            />
          </article>
        </section>

        <section className="personal-note" aria-label="About Grant">
          <p className="rail-label">A little more personal</p>
          <p>
            I’m a software engineer, writer, tennis player, new dad, and relentless app
            tinkerer in Chicago by way of Kansas City. I spend my workdays building AI
            products at Limelight and occasionally help teams through Groundwork AI.
          </p>
        </section>

        <footer className="site-footer">
          <p>Grant Isom · Writer, maker, curious person</p>
          <p>Chicago, Illinois · My corner of the internet</p>
        </footer>
      </main>
    </div>
  );
}
