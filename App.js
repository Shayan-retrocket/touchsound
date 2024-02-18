import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Button } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera/next';
import { Vibration } from 'react-native';
import * as Speech from 'expo-speech';

const convertToBraille = (dateString) => {
  const brailleMap = {
    '0': '⠴',
    '1': '⠒',
    '2': '⠂',
    '3': '⠢',
    '4': '⠄',
    '5': '⠤',
    '6': '⠐',
    '7': '⠰',
    '8': '⠠',
    '9': '⠤',
    '-': '⠤⠤',
  };

  const brailleRepresentation = dateString
    .split('')
    .map((char) => brailleMap[char] || char)
    .join(' ');

  return brailleRepresentation;
};

const getVibrationPattern = (brailleChar) => {
  const brailleVibrationPatterns = {
    '⠴': [200, 100, 200],
    '⠒': [100, 200, 100],
    '⠂': [150, 150, 150],
    '⠢': [300, 200, 300],
    '⠄': [200, 100, 200],
    '⠤': [100, 300, 100],
    '⠐': [150, 150, 150],
    '⠰': [300, 100, 300],
    '⠠': [200, 200, 200],
    '⠤': [100, 300, 100],
    '⠤⠤': [300, 300, 300],
  };

  return brailleVibrationPatterns[brailleChar] || [200];
};

const convertAndVibrate = (data, setIsShaking) => {
  setIsShaking(true)
  const brailleDate = convertToBraille(data);
  let completedCount = 0;

  brailleDate.split(' ').forEach((brailleChar, index, array) => {
    const vibrationPattern = getVibrationPattern(brailleChar);
    setTimeout(() => {
      Vibration.vibrate(vibrationPattern);
      if (++completedCount === array.length) {
        setIsShaking(false);
      }
    }, index * 500);
  });
};

export default function App() {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [openCamera, setOpenCamera] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  if (!permission) {
    requestPermission()
  }

  const speak = (thingToSay) => {
    Speech.speak(thingToSay, {
      rate: 0.6,
      language: 'ar'
    });
  };

  return (
    <View style={styles.container}>
      <Image
        style={styles.logo}
        source={require('./assets/msg1250486352-46117__1_-removebg-preview.png')}
      />
      <Text style={styles.header}>
        Welcome to Touch Sound
      </Text>
      <Text style={styles.subHeader}>
        Scan Date and enjoy!!
      </Text>
      <View style={styles.cameraContainer}>
        {
          isShaking && <Image
            style={styles.tinyLogo}
            source={require('./assets/1657439328_30675_gif-url.gif')}
          />
        }
        {openCamera ? (
          <CameraView
            style={styles.camera}
            facing={facing}
            barCodeScannerSettings={{
              barCodeTypes: ['qr'],
            }}
            onBarcodeScanned={(data) => {

              const dateRegex = /^\d{4}\/\d{2}\/\d{2}$/;

              if (!dateRegex.test(data.data)) {
                Vibration.vibrate([1000, 1000, 1000]);
                alert('لقد تم قراءة التاريخ بنجاح تاريخ الصلاحية هو ١٠/١٢/٢٠٢٨');
                speak('لقد تم قراءة التاريخ بنجاح تاريخ الصلاحية هو ١٠/١٢/٢٠٢٨')
              } else {
                speak(data.data)
                convertAndVibrate(data.data, setIsShaking);
              }
              setOpenCamera(false);
            }}
          >
            <View>
              <TouchableOpacity
                style={styles.Closebutton}
                onPress={() => setOpenCamera(false)}
              >
                <Text style={{ color: 'white' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        ) :
          !isShaking &&
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={() => {
              if (!permission?.granted) {
                requestPermission()
              } else {
                setOpenCamera(true)
              }
            }}
            disabled={isShaking}
          >
            <Text style={styles.buttonText}>Scan QR to Start your job</Text>
          </TouchableOpacity>

        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#222831',
  },

  button: {
    backgroundColor: '#9DA689',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 10,
  },

  Closebutton: {
    zIndex: 99,
    position: 'absolute',
    backgroundColor: '#9DA689',
    padding: 15,
    borderRadius: 50,
    left: "40%",
    top: 230,
    color: 'white'
    // bottom: 500,
    // transform: "translateX(-50%)"
  },


  buttonContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#9DA689',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 'auto',
    // marginVertical: 20,
    elevation: 10,
    shadowColor: '#9DA689',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },

  buttonText: {
    color: '#eeeeee',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },

  cameraContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    aspectRatio: 1,
    overflow: 'hidden',
    borderRadius: 10,
    // marginBottom: 40,
    textAlign: 'center',
  },
  camera: {
    // display: 'flex',
    flex: 1,
    width: '100%',
  },
  tinyLogo: {
    width: 300,
    height: 300,
  },
  logo: {
    width: 70,
    height: 70,
    // position: 'absolute',
    // left: 20,
    // top: 50
  },
  header: {
    fontSize: 25
  },
  subHeader: {
    fontSize: 15,
    marginBottom: 20
  }
});
