import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface SplashScreenProps {
  onFinish?: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        onFinish?.();
      }, 500);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return <SplashContent />;
}

function SplashContent() {
  const { width, height } = useWindowDimensions();

  const bgImgWidth = width * 1.64667;
  const bgImgHeight = height * 0.76047;
  const bgImgLeft = -(width * 0.30843);
  const bgImgTop = height * 0.3089;

  return (
    <Animated.View
      exiting={FadeOut.duration(500)}
      style={styles.container}
    >
      <Image
        source={{
          uri: 'https://api.builder.io/api/v1/image/assets/TEMP/2667728da2ccfa92ecc5b90e8ac124028e196133?width=750',
        }}
        style={[
          styles.backgroundImage,
          {
            width: bgImgWidth,
            height: bgImgHeight,
            left: bgImgLeft,
            top: bgImgTop,
          },
        ]}
        contentFit="fill"
      />

      <LinearGradient
        colors={['rgba(255,255,255,0.82)', '#FFFFFF']}
        locations={[0, 0.64]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.logoContainer}>
        <Image
          source={{
            uri: 'https://api.builder.io/api/v1/image/assets/TEMP/066cb059dc79f58998fdc61321bc0927234c36c1?width=368',
          }}
          style={styles.logo}
          contentFit="contain"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top:0,
    left:0,
    right:0,
    bottom:0,
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
  },

  backgroundImage: {
    position: 'absolute',
  },

  logoContainer: {
    position: 'absolute',
    top: '26%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    width: '49%',
    aspectRatio: 184 / 149,
    borderRadius: 3,
  },
});