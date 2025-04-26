// This is a script to delete the bar from the browser console
// To use this script:
// 1. Go to http://localhost:8082/admin in your browser
// 2. Open the browser console (F12 or right-click -> Inspect -> Console)
// 3. Copy and paste this entire script into the console
// 4. Press Enter to execute it

(async function() {
  try {
    // Access the Supabase client that's already available in the application
    const { supabase } = window;
    
    if (!supabase) {
      console.error("Supabase client not found. Make sure you're logged in to the admin page.");
      return;
    }
    
    // Step 1: List all bars to identify what needs to be deleted
    const { data: bars, error: barsError } = await supabase
      .from('bars')
      .select('*');
    
    if (barsError) {
      console.error("Error fetching bars:", barsError);
      return;
    }
    
    console.log("Bars found:", bars.length);
    console.table(bars);
    
    if (bars.length === 0) {
      console.log("No bars found to delete.");
      return;
    }
    
    // Step 2: For each bar, delete related resources and then the bar itself
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
        console.log(`Found ${events.length} events to delete`);
        
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
    
    console.log("Bar deletion process completed!");
    alert("All bars have been deleted. Please refresh the page to see the changes.");
    
  } catch (error) {
    console.error("An unexpected error occurred:", error);
  }
})(); 