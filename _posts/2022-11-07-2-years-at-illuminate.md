---
layout: post
title: "2 Years at Illuminate, A Retrospective"
description: "7min read time"
date: 2022-11-07 23:51:06 +0000
excerpt: "As I move on to the next chapter in my career, I wanted to reflect..."
tags:
  - "career"
  - "engineering management"
  - "reflection"
comments: true
---

As I move on to the next chapter in my career, I wanted to reflect on the past two years at Illuminate. Here are the lessons learned from moving to a 20 person startup from a 26k person company.

### TL;DR

- Things move fast.
- You can make an immediate impact on the organization.
- Your architecture will reflect your organization.
- Managing is more than 1 on 1’s.
- Culture matters even more than at a larger organization.
- Healthcare software is challenging, the data is not uniform, but is some of the most rewarding work.

### Things move fast.

Coming from a larger company, I was used to quarterly planning, long release cycles, and processes for just about everything. One of my favorite things about going to a startup was how quickly we moved. The only processes that existed were for compliance and to ensure high quality with our changes. If you have an idea, or want try something you are empowered to do it!

### Impact

Being at a startup, you can have a tremendous amount of impact and responsibility. It can be a great opportunity to take a chance or risk but can also create silo’s of critical information. During my second year, we decided to try a new approach and have engineers focus on a general area of architecture instead of a product and also participate in a support rotation. With the level of tech debt we were facing, this was an extremely painful switch. Three months in we noticed our team had quickly destroyed most of these silo’s and documented some of our unknowns. One of my coworkers during this time, started writing down everything he came across during his support rotation and how to reproduce or fix the issues. He not only fixed a lot of the issues but he created a shared space that included all the details. As time went on, the rest of the team followed suite and this became one of the greatest changes our team made. He didn’t tell anyone else to do it, just showed everyone and the team immediately bought it. The time spent on support decreased by almost half due to this. I just think that is a great example of how even little things can make a big difference, and when the team is only 8 people, you really feel it.

### Organizational Architecture

One of the things I was excited to be involved in was helping relayout our company’s org chart to be closer to how we did business. From an engineering perspective, there were three things I thought really made an impact:

- We made engineering flatter and less specific, aka SWE’s and SRE’s shared responsibilities and worked closer together.
- Support was incorporated into the entire engineering team versus being something dealt with by client services.
- We created processes that captured data and work being done so we could make objective decisions versus relying on people’s experiences purely.

This ended up showing us some of our biggest pain points and we were able to rapidly adjust.

The next thing we spent a lot of time trying to figure out was how to have client services interact with the engineering team. This led to building out tools and processes that let each organization be more independent from each other. We integrated our work tracking tools like Monday and Jira, and we identified things engineering could pass off to client services to speed up client onboarding. When I first started, client services was at the whim of engineering which meant these tasks like onboarding or transforming data was always held up by engineering. While I am sure this is still ongoing today, we made massive improvements that really helped our teams work together instead of bottleneck each other.

### Managing a Team

Illuminate was my first chance to really manage an entire team. At my previous company, I managed a team of 5 engineers in an organization of 200. This was a wildly different experience. Three hard learning lessons:

- Strong individual contributors do not always make strong managers.

While I believe it can be dangerous to move too slow promoting or recognizing a strong team member, it can be worse to put them in a position they cannot continue to succeed in. Annual review cycles work and prevent a lot of political issues within an organization. There are also times where it makes sense to move someone into a new role outside of cycles, but those should be something done as infrequently as possible.

- Your direct reports should always have a good understanding of how they are performing, aka they should not be caught off guard with good or bad news.

Communication and regular 1 on 1’s are not for you to talk about work, they are there to let your direct report talk with you about anything on their mind and for you to communicate anything about their personal growth within the organization. If you have to let someone go or put them on a performance plan, they should be aware that it was coming. Being caught off guard is not a fun situation for your direct report and will probably lead to a poor professional relationship with them.

- Watch out for legends of the old guard or team members talking about things that “just work” or “don’t want to mess with”.

I really got kicked in the butt when I realized all the stories about previous engineering teams doing miracle work or having to do something extraordinary was just a cover up for tech debt. Nothing is worse than getting a call from a client about a piece of your tech stack that you do not have strong visibility over.

The biggest takeaway I have is that, as a manager, you are there to help your direct reports succeed and provide a buffer from things that prevent them from being able to do great work. You can’t be everyone’s friend but you also need to recognize that you are there to help them first and foremost.

### Culture

If there was only one thing I could take away from this last experience, it would be how important a good work culture is. Especially in a fast paced environment, I realized the health of the team is dependent on making sure work is somewhere where everyone feels supported and can be themselves. When things start getting challenging or an emergency happens, it seemed like these are the things that make the biggest difference. Going forward, will be one of the main things I look for in a company. It cannot be an after thought, it needs to be a priority. I don’t mean free food and ping pong tables or extra days off, but a place that supports their staff in the work they do and understands employees have lives outside of work.

### Healthcare Software

Healthcare software and data is a mess. Nothing is uniform due to the emergence and integration of electronic medical records over the last 40 years. There are some exciting companies and projects tackling those problems around data uniformity and cross organization data sharing, but while I was at Illuminate, it was both fun and challenging working on the data ingestion pipelines across our client base. While everything is generally similar, no two hospitals are the same which led us down some interesting paths around solving this problem at scale. The other interesting thing about AI or machine learning in healthcare is the amount of insights or data points generated versus how many are actually acted on. One of the biggest things I learned was that follow-up, or helping the hospitals track patients related to some insight is one of the biggest holes in the digital space right now. I am excited to see where the team goes the next couple of years working on these problems.

### In Conclusion

I had a great two years at Illuminate and will miss working with the engineering team. It was my first time getting to lead a team of that size and learned a lot in the process. Looking forward, I feel like the experience prepared me for what is to come in my next couple chapters.
