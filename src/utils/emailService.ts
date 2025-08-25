// Complete Email Service using EmailJS with smart template management
import emailjs from '@emailjs/browser';

// EmailJS Configuration - Replace with your actual values
const EMAILJS_SERVICE_ID = 'service_azqbh9e';
const EMAILJS_TEMPLATE_ID_CONTACT = 'template_8ex3j33'; // For contact forms and confirmations
const EMAILJS_TEMPLATE_ID_NEWSLETTER = 'template_e4oorbp'; // For newsletter and notifications
const EMAILJS_PUBLIC_KEY = '8tFc9GCXL3OfQUv5c';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

export class EmailService {
  /**
   * Send contact form submission to admin and confirmation to user
   */
  static async handleContactForm(formData: {
    name: string;
    email: string;
    department: string;
    message: string;
  }): Promise<{ adminSent: boolean; userSent: boolean }> {
    const results = { adminSent: false, userSent: false };

    try {
      // 1. Send to admin (contact@saherflow.com)
      const adminParams = {
        to_email: 'contact@saherflow.com',
        to_name: 'Saher Flow Solutions Team',
        from_name: formData.name,
        from_email: formData.email,
        subject: `New Contact Form: ${formData.department}`,
        message: `
Name: ${formData.name}
Email: ${formData.email}
Department: ${formData.department}
Message: ${formData.message}

Submitted at: ${new Date().toLocaleString()}
        `,
        reply_to: formData.email,
        email_type: 'contact_admin'
      };

      const adminResponse = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID_CONTACT,
        adminParams
      );
      results.adminSent = adminResponse?.status === 200;

      // 2. Send confirmation to user
      const userParams = {
        to_email: formData.email,
        to_name: formData.name,
        from_name: 'Saher Flow Solutions',
        from_email: 'contact@saherflow.com',
        subject: 'Thank you for contacting Saher Flow Solutions',
        message: `
Dear ${formData.name},

Thank you for contacting Saher Flow Solutions. We have received your message regarding ${formData.department}.

Our team will review your inquiry and get back to you within 24 hours.

Best regards,
Saher Flow Solutions Team

---
This is an automated confirmation email.
        `,
        reply_to: 'contact@saherflow.com',
        email_type: 'contact_confirmation'
      };

      const userResponse = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID_CONTACT,
        userParams
      );
      results.userSent = userResponse?.status === 200;

    } catch (error) {
      console.error('Contact form email error:', error);
    }

    return results;
  }

  /**
   * Handle newsletter subscription
   */
  static async handleNewsletterSubscription(email: string): Promise<{
    alreadySubscribed: boolean;
    confirmationSent: boolean;
    adminNotified: boolean;
  }> {
    const results = {
      alreadySubscribed: false,
      confirmationSent: false,
      adminNotified: false
    };

    try {
      // Check if already subscribed
      const subscribers = this.getSubscribers();
      const existingSubscriber = subscribers.find(s => s.email === email);

      if (existingSubscriber && existingSubscriber.status === 'active') {
        results.alreadySubscribed = true;
        return results;
      }

      // Add/update subscriber
      this.addSubscriber(email);

      const firstName = email.split('@')[0];

      // Send welcome email to subscriber
      const welcomeParams = {
        to_email: email,
        to_name: firstName,
        from_name: 'Saher Flow Solutions',
        from_email: 'contact@saherflow.com',
        subject: 'Welcome to Saher Flow Solutions Newsletter!',
        message: `
Dear ${firstName},

Congratulations! You have successfully subscribed to the Saher Flow Solutions newsletter.

You'll now receive:
✅ Latest product updates and innovations
✅ Industry insights and technical papers
✅ Company news and achievements
✅ Exclusive content for subscribers

Thank you for joining our community of flow measurement professionals.

Best regards,
The Saher Flow Solutions Team

---
To unsubscribe, reply to this email with "UNSUBSCRIBE" in the subject line.
        `,
        reply_to: 'contact@saherflow.com',
        email_type: 'newsletter_welcome'
      };

      const welcomeResponse = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID_NEWSLETTER,
        welcomeParams
      );
      results.confirmationSent = welcomeResponse?.status === 200;

      // Notify admin about new subscriber
      const adminParams = {
        to_email: 'contact@saherflow.com',
        to_name: 'Saher Flow Solutions Team',
        from_name: 'Newsletter System',
        from_email: 'contact@saherflow.com',
        subject: 'New Newsletter Subscriber',
        message: `
New subscriber joined the newsletter:

Email: ${email}
Subscribed at: ${new Date().toLocaleString()}
Total subscribers: ${this.getSubscribers().length}
        `,
        reply_to: 'contact@saherflow.com',
        email_type: 'admin_notification'
      };

      const adminResponse = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID_CONTACT,
        adminParams
      );
      results.adminNotified = adminResponse?.status === 200;

    } catch (error) {
      console.error('Newsletter subscription error:', error);
    }

    return results;
  }

  /**
   * Handle career application (using Web3Forms for file support)
   */
  static async handleCareerApplication(formData: {
    name: string;
    email: string;
    phone: string;
    position: string;
    experience: string;
    location: string;
    coverLetter: string;
    resume: File | null;
  }): Promise<{ adminSent: boolean; userSent: boolean }> {
    const results = { adminSent: false, userSent: false };

    try {
      // 1. Send application to admin using Web3Forms (supports files)
      const adminFormData = new FormData();
      adminFormData.append('access_key', 'YOUR_WEB3FORMS_ACCESS_KEY'); // You'll get this from web3forms.com
      adminFormData.append('subject', `New Job Application: ${formData.position}`);
      adminFormData.append('from_name', formData.name);
      adminFormData.append('email', 'career@saherflow.com');
      adminFormData.append('message', `
New job application received:

Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}
Position: ${formData.position}
Experience: ${formData.experience}
Location: ${formData.location}

Cover Letter:
${formData.coverLetter}

Applied at: ${new Date().toLocaleString()}
      `);
      
      if (formData.resume) {
        adminFormData.append('attachment', formData.resume);
      }

      const adminResponse = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: adminFormData
      });
      results.adminSent = adminResponse.ok;

      // 2. Send confirmation to applicant using EmailJS
      const userParams = {
        to_email: formData.email,
        to_name: formData.name,
        from_name: 'Saher Flow Solutions HR Team',
        from_email: 'career@saherflow.com',
        subject: 'Application Received - Saher Flow Solutions',
        message: `
Dear ${formData.name},

Thank you for your interest in the ${formData.position} position at Saher Flow Solutions.

We have successfully received your application and resume. Our HR team will review your qualifications and get back to you within 5-7 business days.

Application Details:
- Position: ${formData.position}
- Submitted: ${new Date().toLocaleString()}

We appreciate your interest in joining our innovative team in Saudi Arabia.

Best regards,
Saher Flow Solutions HR Team

---
This is an automated confirmation email.
        `,
        reply_to: 'career@saherflow.com',
        email_type: 'career_confirmation'
      };

      const userResponse = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID_CONTACT,
        userParams
      );
      results.userSent = userResponse?.status === 200;

    } catch (error) {
      console.error('Career application error:', error);
    }

    return results;
  }

  /**
   * Send new article notification to all subscribers
   */
  static async notifySubscribersNewArticle(article: {
    title: string;
    excerpt: string;
    url: string;
    type: 'news' | 'blog';
  }): Promise<{ success: number; failed: number }> {
    const subscribers = this.getActiveSubscribers();
    let success = 0;
    let failed = 0;

    console.log(`Notifying ${subscribers.length} subscribers about new ${article.type}: ${article.title}`);

    for (const subscriber of subscribers) {
      try {
        const firstName = subscriber.email.split('@')[0];
        const params = {
          to_email: subscriber.email,
          to_name: firstName,
          from_name: 'Saher Flow Solutions',
          from_email: 'contact@saherflow.com',
          subject: `New ${article.type === 'news' ? 'News' : 'Blog Post'}: ${article.title}`,
          message: `
Dear ${firstName},

We've just published a new ${article.type === 'news' ? 'news article' : 'blog post'}!

Title: ${article.title}

${article.excerpt}

Read the full ${article.type === 'news' ? 'article' : 'post'} here: ${window.location.origin}${article.url}

Best regards,
The Saher Flow Solutions Team

---
To unsubscribe, reply to this email with "UNSUBSCRIBE" in the subject line.
          `,
          reply_to: 'contact@saherflow.com',
          email_type: 'article_notification'
        };

        const response = await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID_NEWSLETTER,
          params
        );

        if (response?.status === 200) {
          success++;
        } else {
          failed++;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Failed to notify ${subscriber.email}:`, error);
        failed++;
      }
    }

    console.log(`Notification complete: ${success} successful, ${failed} failed`);
    return { success, failed };
  }

  // Subscriber management methods
  private static getSubscribers(): Array<{email: string; subscribedAt: string; status: 'active' | 'unsubscribed'}> {
    try {
      const stored = localStorage.getItem('saher_newsletter_subscribers');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private static addSubscriber(email: string): void {
    const subscribers = this.getSubscribers();
    const existingIndex = subscribers.findIndex(s => s.email === email);
    
    if (existingIndex >= 0) {
      subscribers[existingIndex].status = 'active';
    } else {
      subscribers.push({
        email,
        subscribedAt: new Date().toISOString(),
        status: 'active'
      });
    }
    
    localStorage.setItem('saher_newsletter_subscribers', JSON.stringify(subscribers));
  }

  private static getActiveSubscribers(): Array<{email: string; subscribedAt: string; status: 'active'}> {
    return this.getSubscribers().filter(s => s.status === 'active') as Array<{email: string; subscribedAt: string; status: 'active'}>;
  }

  /**
   * Check for new articles and auto-notify subscribers
   */
  static async checkForNewContent(): Promise<void> {
    try {
      // This will be called when new articles are detected
      const lastCheck = localStorage.getItem('saher_last_content_check');
      const now = new Date().toISOString();
      
      // Store current check time
      localStorage.setItem('saher_last_content_check', now);
      
      // In a real implementation, you would compare with previous content
      console.log('Content check completed at:', now);
    } catch (error) {
      console.error('Content check error:', error);
    }
  }
}

export const validateEmailJSConfig = (): boolean => {
  return EMAILJS_SERVICE_ID !== 'your_service_id_here' && 
         EMAILJS_PUBLIC_KEY !== 'your_public_key_here';
};