# React Native / Hermes
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStripAny
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Reanimated
-keep class com.swmansion.reanimated.** { *; }

# Firebase (reflection)
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn com.google.firebase.**

# Image picker
-keep class com.imagepicker.** { *; }
