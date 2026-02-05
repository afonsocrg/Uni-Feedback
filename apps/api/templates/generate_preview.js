#!/usr/bin/env node
/**
 * Quick script to regenerate the preview HTML with different dummy data
 * Usage: node generate_preview.js
 */

const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

// Dummy data matching the ReportData interface
const dummyData = {
  schoolYear: 2024,
  courseName: 'Artificial Intelligence Fundamentals',
  courseCode: 'CS-101',
  ects: 6.0,
  degree: 'Computer Science and Engineering',
  avgRating: '4.3',
  distribution: { 1: 0, 2: 2, 3: 6, 4: 14, 5: 18 },
  totalResponses: 40,
  avgWorkloadText: 'Moderate',
  workloadDistribution: { 1: 2, 2: 5, 3: 18, 4: 12, 5: 3 },
  totalWorkloadResponses: 40,
  aiSummary: 'This course offers a comprehensive introduction to AI concepts with well-structured lectures and engaging projects. Students consistently praise the professor\'s teaching style and the practical hands-on approach, though some note the workload can be demanding during project deadlines.',
  emotions: ['Engaging', 'Challenging', 'Rewarding'],
  persona: 'A motivated student who enjoys practical coding projects and appreciates clear explanations of complex topics.',
  pros: [
    'Excellent professor with clear explanations',
    'Hands-on projects that reinforce concepts',
    'Well-structured curriculum and materials',
    'Great introduction to AI fundamentals',
    'Active discussion forum and support'
  ],
  cons: [
    'Heavy workload during project weeks',
    'Requires solid programming background',
    'Fast-paced content, stay on top of lectures',
    'Final exam can be quite challenging'
  ],
  submissions: [
    {
      rating: 5,
      workload: 'Moderate',
      date: 'Jan 15, 2024',
      comment: 'Amazing course! The professor explains complex concepts in a way that\'s easy to understand. The projects were challenging but really helped solidify the material. Highly recommend taking this course if you\'re interested in AI.'
    },
    {
      rating: 4,
      workload: 'Heavy',
      date: 'Jan 22, 2024',
      comment: 'Great content and well-organized lectures. The workload is pretty heavy, especially during project deadlines. Make sure you have good time management skills. The final exam was tough but fair.'
    },
    {
      rating: 5,
      workload: 'Light',
      date: 'Feb 3, 2024',
      comment: 'One of the best courses I\'ve taken. The professor is super knowledgeable and passionate about the subject. The hands-on approach with real-world examples made learning enjoyable. Would definitely take another course with this professor.'
    },
    {
      rating: 3,
      workload: 'Moderate',
      date: 'Feb 10, 2024',
      comment: 'Decent course overall. The material is interesting but the pace can be quite fast. I struggled a bit with some of the more advanced topics. Office hours were helpful though. Would recommend having a strong programming foundation before taking this.'
    },
    {
      rating: 4,
      workload: 'Not specified',
      date: 'Feb 18, 2024',
      comment: null
    }
  ]
};

// Render the template
const templatePath = path.join(__dirname, 'course_report.ejs');
const outputPath = path.join(__dirname, 'course_report_preview_generated.html');

ejs.renderFile(templatePath, { data: dummyData }, (err, html) => {
  if (err) {
    console.error('Error rendering template:', err);
    process.exit(1);
  }

  // Add dev overlay to generated preview
  const htmlWithOverlay = html.replace(
    '<body class="bg-slate-50 text-[#111827]">',
    `<body class="bg-slate-50 text-[#111827]">
    <!-- Dev Tools Overlay -->
    <div style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px 15px; border-radius: 8px; font-size: 12px; z-index: 9999;">
        🎨 Generated Preview - Edit template and run again
    </div>`
  );

  fs.writeFileSync(outputPath, htmlWithOverlay);
  console.log(`✅ Preview generated: ${outputPath}`);
  console.log('🌐 Open in browser to see your changes!');
});
