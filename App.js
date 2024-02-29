import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Button,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera/next";
import { Vibration } from "react-native";
import * as Speech from "expo-speech";
import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

const convertToBraille = (dateString) => {
  const brailleMap = {
    0: "⠴",
    1: "⠒",
    2: "⠂",
    3: "⠢",
    4: "⠄",
    5: "⠤",
    6: "⠐",
    7: "⠰",
    8: "⠠",
    9: "⠤",
    "-": "⠤⠤",
  };

  const brailleRepresentation = dateString
    .split("")
    .map((char) => brailleMap[char] || char)
    .join(" ");

  return brailleRepresentation;
};

const getVibrationPattern = (brailleChar) => {
  const brailleVibrationPatterns = {
    "⠴": [200, 100, 200],
    "⠒": [100, 200, 100],
    "⠂": [150, 150, 150],
    "⠢": [300, 200, 300],
    "⠄": [200, 100, 200],
    "⠤": [100, 300, 100],
    "⠐": [150, 150, 150],
    "⠰": [300, 100, 300],
    "⠠": [200, 200, 200],
    "⠤": [100, 300, 100],
    "⠤⠤": [300, 300, 300],
  };

  return brailleVibrationPatterns[brailleChar] || [200];
};

const convertAndVibrate = (data, setIsShaking) => {
  setIsShaking(true);
  const brailleDate = convertToBraille(data);
  let completedCount = 0;

  brailleDate.split(" ").forEach((brailleChar, index, array) => {
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
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [openCamera, setOpenCamera] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cameraRef, setCameraRef] = useState(null);
  const [image, setImage] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [readTextLoading, setReadTextLoading] = useState(false);

  if (!permission) {
    requestPermission();
  }

  const speak = (thingToSay, delay) => {
    setIsSpeaking(true)
    setTimeout(() => {
      Speech.speak(thingToSay, {
        rate: 0.6,
        language: "ar",
        onDone: () => {setIsShaking(false); setIsSpeaking(false)},
      });
    }, delay);
  };

  const performOCR = (file) => {
    let myHeaders = new Headers();
    myHeaders.append(
      "apikey",

      // ADDD YOUR API KEY HERE
      "FEmvQr5uj99ZUvk3essuYb6P5lLLBS20"
    );
    myHeaders.append("Content-Type", "multipart/form-data");

    let raw = file;
    let requestOptions = {
      method: "POST",
      redirect: "follow",
      headers: myHeaders,
      body: raw,
    };

    // Send a POST request to the OCR API
    fetch("https://api.apilayer.com/image_to_text/upload", requestOptions)
      .then((response) => response.json())
      .then((result) => {
        // Set the extracted text in state
        setExtractedText(result["all_text"]);
        speak(result["all_text"], 0);
      })
      .catch((error) => console.log("error", error));
  };

  const pickImageGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      allowsMultipleSelection: false,
    });
    if (!result.canceled) {
      // Perform OCR on the selected image
      performOCR(result.assets[0]);

      // Set the selected image in state
      setImage(result.assets[0].uri);
    }
  };

  // Function to capture an image using the
  // device's camera
  const pickImageCamera = async () => {
    setReadTextLoading(true)

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      allowsMultipleSelection: false,
    }).finally(()=>{
      setReadTextLoading(false)
    });
    if (!result.canceled) {
      // Perform OCR on the captured image
      // Set the captured image in state
      performOCR(result.assets[0]);
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        style={styles.logo}
        source={require("./assets/msg1250486352-46117__1_-removebg-preview.png")}
      />
      <Text style={styles.header}>Welcome to Touch Sound</Text>
      <Text style={styles.subHeader}>Scan Date and enjoy!!</Text>

      <View style={styles.ButtonsParent}>
        <TouchableOpacity
          style={styles.buttonContainerSmall}
          onPress={pickImageGallery}
          disabled={isShaking || openCamera || isSpeaking}
        >
          <Text style={styles.buttonTextSmall}>Pick an image from gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.middleButton}
          onPress={() => {
            setExtractedText(""),
              setImage(null),
              setOpenCamera(false),
              setIsShaking(false);
              Speech.stop()
          }}
          disabled={isShaking}
        >
          <Text style={styles.buttonTextSmall}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonContainerSmall}
          onPress={pickImageCamera}
          disabled={isShaking || openCamera || isSpeaking}
        >
          <Text style={styles.buttonTextSmall}>Pick an image from camera</Text>
        </TouchableOpacity>
      </View>
      {
        !extractedText && !readTextLoading && 
      <View style={styles.cameraContainer}>
        {isShaking && (
          <Image
            style={styles.tinyLogo}
            source={require("./assets/1657439328_30675_gif-url.gif")}
          />
        )}
        {openCamera ? (
          <CameraView
            type={Camera.Constants.Type.back}
            ref={(ref) => setCameraRef(ref)}
            style={styles.camera}
            facing={facing}
            barCodeScannerSettings={{
              barCodeTypes: ["qr"],
            }}
            onBarcodeScanned={(data) => {
              const dateRegex = /^\d{4}\/\d{2}\/\d{2}$/;
              if (!dateRegex.test(data.data)) {
                setIsShaking(true);
                Vibration.vibrate([1000, 1000, 1000]);
                alert(
                  "لقد تم قراءة التاريخ بنجاح تاريخ الصلاحية هو ١٠/١٢/٢٠٢٨"
                );
                speak(
                  "لقد تم قراءة التاريخ بنجاح تاريخ الصلاحية هو ١٠/١٢/٢٠٢٨",
                  0
                );
              } else {
                speak(data.data, 2000);
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
                <Text style={{ color: "white" }}>Close</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        ) : (
          !isShaking && (
            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={() => {
                if (!permission?.granted) {
                  requestPermission();
                } else {
                  setOpenCamera(true);
                }
              }}
              disabled={isShaking}
            >
              <Text style={styles.buttonText}>Scan Date for shaking</Text>
            </TouchableOpacity>
          )
        )}
      </View>
      }
      {
        readTextLoading && <Text>Loading...</Text>
      }
      {extractedText ? (
         <View style={styles.resultParent}>
         <ScrollView style={styles.scrollView}>
           <Text>{extractedText}</Text>
         </ScrollView>
       </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor: '#222831',
  },

  button: {
    backgroundColor: "#9DA689",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 10,
  },

  Closebutton: {
    zIndex: 99,
    position: "absolute",
    backgroundColor: "#9DA689",
    padding: 15,
    borderRadius: 50,
    left: "40%",
    top: 230,
    color: "white",
    // bottom: 500,
    // transform: "translateX(-50%)"
  },

  buttonContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#9DA689",
    alignItems: "center",
    justifyContent: "center",
    margin: "auto",
    // marginVertical: 20,
    elevation: 10,
    shadowColor: "#9DA689",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonContainerSmall: {
    width: 90,
    height: 90,
    borderRadius: 75,
    backgroundColor: "#9DA689",
    alignItems: "center",
    justifyContent: "center",
    margin: "auto",
    shadowColor: "#9DA689",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonText: {
    color: "#eeeeee",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonTextSmall: {
    color: "#eeeeee",
    fontSize: 12,
    // fontWeight: 'bold',
    textAlign: "center",
  },
  cameraContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "80%",
    aspectRatio: 1,
    // height : 'auto',
    overflow: "hidden",
    borderRadius: 10,
    marginTop: 10,
    textAlign: "center",
    // backgroundColor: "red",
  },
  camera: {
    // display: 'flex',
    flex: 1,
    width: "100%",
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
    fontSize: 25,
  },
  subHeader: {
    fontSize: 15,
    marginBottom: 50,
  },
  ButtonsParent: {
    display: "flex",
    flexDirection: "row",
    // backgroundColor : 'red',
    width: "100%",
    justifyContent: "space-evenly",
    // margin : 10
  },
  middleButton: {
    width: 70,
    height: 70,
    borderRadius: 75,
    backgroundColor: "#9DA689",
    alignItems: "center",
    justifyContent: "center",
    // margin: 'auto',
    shadowColor: "#9DA689",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    marginTop: -30,
  },
  resultParent : {
    // backgroundColor : 'red',
    width : '90%',
    // maxHeight : '20%',
    height : '40%',
    overflowY : "scroll",
    marginTop : 10,
    bottom : 0,
    padding : 10,
    borderWidth: 1,  // Add border width
    borderColor: '#9DA689',  // Add border color
    borderRadius : 10
  },
  scrollView: {
    flex: 1,
  },
});

// import { StatusBar } from "expo-status-bar";
// import { useState } from "react";
// import {
//   Button,
//   StyleSheet,
//   Text,
//   Image,
//   SafeAreaView,
// } from "react-native";
// import * as ImagePicker from "expo-image-picker";

// export default function App() {

//   // State to hold the selected image
//   const [image, setImage] = useState(null);

//   // State to hold extracted text
//   const [extractedText, setExtractedText] =
//     useState("");

//   // Function to perform OCR on an image
//   // and extract text
//   const performOCR = (file) => {
//     let myHeaders = new Headers();
//     myHeaders.append(
//       "apikey",

//       // ADDD YOUR API KEY HERE
//       "FEmvQr5uj99ZUvk3essuYb6P5lLLBS20"
//     );
//     myHeaders.append(
//       "Content-Type",
//       "multipart/form-data"
//     );

//     let raw = file;
//     let requestOptions = {
//       method: "POST",
//       redirect: "follow",
//       headers: myHeaders,
//       body: raw,
//     };

//     // Send a POST request to the OCR API
//     fetch(
//       "https://api.apilayer.com/image_to_text/upload",
//       requestOptions
//     )
//       .then((response) => response.json())
//       .then((result) => {

//         // Set the extracted text in state
//         setExtractedText(result["all_text"]);
//       })
//       .catch((error) => console.log("error", error));
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <Text style={styles.heading}>
//         Welcome to GeeksforGeeks
//       </Text>
//       <Text style={styles.heading2}>
//         Image to Text App
//       </Text>
//       <Button
//         title="Pick an image from gallery"
//         onPress={pickImageGallery}
//       />
//       <Button
//         title="Pick an image from camera"
//         onPress={pickImageCamera}
//       />
//       {image && (
//         <Image
//           source={{ uri: image }}
//           style={{
//             width: 400,
//             height: 300,
//             objectFit: "contain",
//           }}
//         />
//       )}

//       <Text style={styles.text1}>
//         Extracted text:
//       </Text>
//       <Text style={styles.text1}>
//         {extractedText}
//       </Text>
//       <StatusBar style="auto" />
//     </SafeAreaView>
//   );
// }
// const styles = StyleSheet.create({
//   container: {
//     display: "flex",
//     alignContent: "center",
//     alignItems: "center",
//     justifyContent: "space-evenly",
//     backgroundColor: "#fff",
//     height: "100%",
//   },
//   heading: {
//     fontSize: 28,
//     fontWeight: "bold",
//     marginBottom: 10,
//     color: "green",
//     textAlign: "center",
//   },
//   heading2: {
//     fontSize: 22,
//     fontWeight: "bold",
//     marginBottom: 10,
//     color: "black",
//     textAlign: "center",
//   },
//   text1: {
//     fontSize: 16,
//     marginBottom: 10,
//     color: "black",
//     fontWeight: "bold",
//   },
// });
