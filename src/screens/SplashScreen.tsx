import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';

export default function SplashScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      // @ts-ignore
      navigation.replace('MainTabs');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animatable.Image
        animation="fadeInDown"
        duration={1500}
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="cover"
      />
      <Animatable.Text
        animation="fadeInUp"
        duration={2000}
        style={styles.title}
      >
        Personal Finance Tracker App
      </Animatable.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A2742',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 12,
  },
  title: {
    marginTop: 20,
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
  },
});
