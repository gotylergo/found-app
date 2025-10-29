const express = require('express');
const app = express();
const PORT = 3000;

// Get the notification topic from the environment variable
const NTFY_TOPIC = process.env.NTFY_TOPIC;

// This is your "database" of valid tags.
const VALID_TAGS = ['gs1', 'luggage1', 'backpack2', 'keys'];

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

//
// --- 1. Main Page Logic ---
//
app.get('/', (req, res) => {
      const tag = req.query.tag;

        if (tag && VALID_TAGS.includes(tag)) {
                res.send(getContactFormPage(tag));
        } else {
                res.send(getTagLookupPage());
        }
});

//
// --- 2. Tag Lookup Form (from landing page) ---
//
app.post('/lookup', (req, res) => {
      const tagId = req.body.tagId;
        res.redirect(`/?tag=${tagId}`);
});

//
// --- 3. Contact Form Submission (the real one) ---
//
app.post('/submit', (req, res) => {
      const { contactInfo, message, tag } = req.body;

        // --- Log to Docker Console (as before) ---
          console.log('=======================================');
            console.log('         NEW FOUND ITEM SUBMISSION     ');
              console.log(`Tag ID:    ${tag}`);
                console.log(`Contact:   ${contactInfo}`);
                  console.log(`Message:   ${message}`);
                    console.log('=======================================');

                      // --- NEW: Send Phone Notification ---
                        if (NTFY_TOPIC) {
                                sendNotification(tag, contactInfo, message);
                        } else {
                                console.warn('NTFY_TOPIC environment variable is not set. Skipping push notification.');
                        }

                          // Show a simple thank you page
                            res.send(getThankYouPage());
});

app.listen(PORT, () => {
      console.log(`Found app listening on port ${PORT}`);
        if (NTFY_TOPIC) {
                console.log(`Notifications will be sent to ntfy.sh/${NTFY_TOPIC}`);
        }
});

//
// --- NEW NOTIFICATION FUNCTION ---
//
async function sendNotification(tag, contact, message) {
      try {
            await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
                      method: 'POST',
                            body: `Contact: ${contact}\nMessage: ${message}`,
                                  headers: {
                                            'Title': `Item Found: ${tag}`, // Notification Title
                                                    'Priority': 'high',             // Makes it an urgent alert
                                                            'Tags': 'luggage'               // Adds a luggage emoji
                                  }
            });
                console.log('Push notification sent successfully.');
      } catch (error) {
            console.error('Failed to send push notification:', error);
      }
}

//
// --- HTML TEMPLATES (No Changes) ---
//

const getBaseStyles = () => `
  <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: grid; place-items: center; min-height: 90vh; background: #f9f9f9; margin: 0; }
          .container { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 2rem; max-width: 500px; width: 90%; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
              h1 { margin-top: 0; }
                  p { line-height: 1.6; }
                      label { font-weight: 600; display: block; margin-top: 1rem; }
                          input[type="text"], textarea { width: 100%; padding: 0.5rem; margin-top: 0.25rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
                              button { background: #007aff; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 1rem; width: 100%; }
                                  button:hover { background: #0056b3; }
                                    </style>
                                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                      `;

                                      // Page 1: User types found.tylerj.dev
                                      const getTagLookupPage = () => `
                                        <!DOCTYPE html><html lang="en">
                                          <head><title>Found Item</title>${getBaseStyles()}</head>
                                            <body>
                                                <div class="container">
                                                      <h1>Found an Item?</h1>
                                                            <p>Thank you for scanning! Please enter the <strong>Tag ID</strong> printed on the item's tag to continue.</p>
                                                                  <form action="/lookup" method="POST">
                                                                          <label for="tagId">Tag ID:</label>
                                                                                  <input id="tagId" type="text" name="tagId" placeholder="e.g., gs1" required>
                                                                                          <button type="submit">Find Owner</button>
                                                                                                </form>
                                                                                                    </div>
                                                                                                      </body></html>
                                                                                                      `;

                                                                                                      // Page 2: User scans .../?tag=gs1 OR successfully looks it up
                                                                                                      const getContactFormPage = (tag) => `
                                                                                                        <!DOCTYPE html><html lang="en">
                                                                                                          <head><title>Contact Owner</title>${getBaseStyles()}</head>
                                                                                                            <body>
                                                                                                                <div class="container">
                                                                                                                      <h1>Thank you for finding my item!</h1>
                                                                                                                            <p>Please let me know how I can get in touch with you to coordinate its return. This form will securely notify me.</p>
                                                                                                                                  <form action="/submit" method="POST">
                                                                                                                                          <label for="contactInfo">Your Email or Phone:</label>
                                                                                                                                                  <input id="contactInfo" type="text" name="contactInfo" required>
                                                                                                                                                          <label for="message">Message:</label>
                                                                                                                                                                  <textarea id="message" name="message" rows="4" placeholder="e.g., 'I found your bag at Haneda Airport. I'm at the information desk.'"></textarea>
                                                                                                                                                                          <input type="hidden" name="tag" value="${tag}">
                                                                                                                                                                                  <button type="submit">Send Message</button>
                                                                                                                                                                                        </form>
                                                                                                                                                                                            </div>
                                                                                                                                                                                              </body></html>
                                                                                                                                                                                              `;

                                                                                                                                                                                              // Page 3: After submission
                                                                                                                                                                                              const getThankYouPage = () => `
                                                                                                                                                                                                <!DOCTYPE html><html lang="en">
                                                                                                                                                                                                  <head><title>Message Sent</title>${getBaseStyles()}</head>
                                                                                                                                                                                                    <body>
                                                                                                                                                                                                        <div class="container">
                                                                                                                                                                                                              <h1>Thank You!</h1>
                                                                                                                                                                                                                    <p>Your message has been sent. I'll be in touch with you shortly to arrange the return.</p>
                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                          </body></html>
                                                                                                                                                                                                                          `;
                                                                                                                                                                                                                          
      }
                                  }
            })
      }
}
        }
})
                        }
                        }
})
})
        }
        }
})