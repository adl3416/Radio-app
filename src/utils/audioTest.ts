import { simpleRadioAudioService, RadioAudioState } from '../services/simpleRadioAudioService';

// Simple test utility to verify audio service works
export const testAudioService = async () => {
  console.log('🧪 Testing Modern Radio Audio Service...');
  
  try {
    // Test initialization
    await simpleRadioAudioService.initialize();
    console.log('✅ Audio service initialized');
    
    // Get initial state
    const state = simpleRadioAudioService.getState();
    console.log('📊 Initial state:', state);
    
    // Test subscription
    const unsubscribe = simpleRadioAudioService.subscribe((newState: RadioAudioState) => {
      console.log('🔄 State changed:', newState);
    });
    
    console.log('✅ Subscription test passed');
    
    // Test with a sample radio station
    const testStation = {
      id: 'test-1',
      name: 'Test Radio',
      url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/VIRGIN_RADIO_TR.mp3',
      description: 'Test station'
    };
    
    console.log('🎵 Testing radio playback...');
    await simpleRadioAudioService.play(testStation);
    
    // Wait a bit then stop
    setTimeout(async () => {
      await simpleRadioAudioService.stop();
      unsubscribe();
      console.log('🛑 Test completed');
    }, 5000);
    
  } catch (error) {
    console.error('❌ Audio service test failed:', error);
  }
};
