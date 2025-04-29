// A Node.js script to delete all bars in the database
// Run with: node delete-bar.js

import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = 'https://ikuxbrtbayefaqfiuiop.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrdXhicnRiYXllZmFxZml1aW9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDYwMDk5OSwiZXhwIjoyMDYwMTc2OTk5fQ.NsOSnC5OdXkpX76okI4t4Nx7aDlywDz6RkVGLpvg4GA';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deleteAllBars() {
  try {
    console.log('Starting bar deletion process...');

    // Step 1: Get all bars
    const { data: bars, error: barsError } = await supabase
      .from('bars')
      .select('*');

    if (barsError) {
      console.error('Error fetching bars:', barsError);
      return;
    }

    console.log(`Found ${bars.length} bars to delete`);

    if (bars.length === 0) {
      console.log('No bars to delete!');
      return;
    }

    // Step 2: Process each bar
    for (const bar of bars) {
      console.log(`Processing bar: ${bar.name} (ID: ${bar.id})`);

      // 2.1: Delete bar images from storage if they exist
      if (bar.image) {
        console.log(`Deleting main image: ${bar.image}`);

        // Get filename from URL
        const imageFilename = bar.image.split('/').pop();

        // Delete from storage
        const { error: imageError } = await supabase.storage
          .from('bar-images')
          .remove([imageFilename]);

        if (imageError) {
          console.warn(`Warning: Could not delete main image: ${imageError.message}`);
        }
      }

      // 2.2: Delete additional images
      if (bar.additional_images && bar.additional_images.length > 0) {
        for (const imgUrl of bar.additional_images) {
          if (imgUrl) {
            console.log(`Deleting additional image: ${imgUrl}`);

            // Get filename from URL
            const imageFilename = imgUrl.split('/').pop();

            // Delete from storage
            const { error: additionalImageError } = await supabase.storage
              .from('bar-images')
              .remove([imageFilename]);

            if (additionalImageError) {
              console.warn(`Warning: Could not delete additional image: ${additionalImageError.message}`);
            }
          }
        }
      }

      // 2.3: Delete associated events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, image')
        .eq('bar_id', bar.id);

      if (eventsError) {
        console.warn(`Warning: Error fetching events for bar ${bar.id}: ${eventsError.message}`);
      } else if (events && events.length > 0) {
        console.log(`Found ${events.length} events to delete for bar ${bar.id}`);

        for (const event of events) {
          // Delete event image if it exists
          if (event.image) {
            console.log(`Deleting event image: ${event.image}`);

            // Get filename from URL
            const imageFilename = event.image.split('/').pop();

            // Delete from storage
            const { error: eventImageError } = await supabase.storage
              .from('event-images')
              .remove([imageFilename]);

            if (eventImageError) {
              console.warn(`Warning: Could not delete event image: ${eventImageError.message}`);
            }
          }

          // Delete the event from the database
          const { error: deleteEventError } = await supabase
            .from('events')
            .delete()
            .eq('id', event.id);

          if (deleteEventError) {
            console.error(`Error deleting event ${event.id}: ${deleteEventError.message}`);
          } else {
            console.log(`Successfully deleted event ${event.id}`);
          }
        }
      }

      // 2.4: Delete bar statistics if they exist
      const { error: statsError } = await supabase
        .from('bar_views')
        .delete()
        .eq('bar_id', bar.id);

      if (statsError) {
        console.warn(`Warning: Error deleting statistics for bar ${bar.id}: ${statsError.message}`);
      } else {
        console.log(`Successfully deleted statistics for bar ${bar.id}`);
      }

      // 2.5: Finally, delete the bar itself
      const { error: deleteBarError } = await supabase
        .from('bars')
        .delete()
        .eq('id', bar.id);

      if (deleteBarError) {
        console.error(`Error deleting bar ${bar.id}: ${deleteBarError.message}`);
      } else {
        console.log(`Successfully deleted bar ${bar.id}`);
      }
    }

    console.log('Bar deletion process completed successfully!');
    console.log('Please refresh your application to see the changes.');

  } catch (error) {
    console.error('An unexpected error occurred:', error);
  }
}

// Run the deletion function
deleteAllBars(); 