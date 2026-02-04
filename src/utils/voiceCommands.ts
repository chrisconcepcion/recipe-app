import { useEffect, useState } from 'react';
// import ReactNativeVoice from '@react-native-voice/voice'; // Not installed

const useVoiceNavigation = () => {
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);

  useEffect(() => {
    // Stub implementation as voice library is missing
    /*
    let subscription: any;
    const listener = (data: any) => {
      const text = data.results[0][0].transcript.toLowerCase();
      if (text.includes('next phase')) {
        // navigation.navigate('RecipeDetail');
      } else if (text.startsWith('go to ')) {
        const targetPhaseIndex = parseInt(text.replace('go to ', ''), 10) - 1;
        // if (!isNaN(targetPhaseIndex) && targetPhaseIndex < phases.length) {
        //   setActivePhaseIndex(targetPhaseIndex);
        // }
      }
    };

    subscription = ReactNativeVoice.onSpeechResults(listener);

    return () => {
      ReactNativeVoice.stop();
      subscription.remove();
    };
    */
  }, []);

  return { activePhaseIndex, setActivePhaseIndex };
};