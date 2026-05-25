import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { List } from 'react-native-paper';
import type { SettingsStackParamList } from '@app/navigation/types';
import { spacing } from '@app/theme';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';

export const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();

  return (
    <ScreenLayout>
      <View style={styles.list}>
        <List.Item
          title="Fine Management"
          description="Track and manage customer fines"
          left={props => <List.Icon {...props} icon="cash-multiple" />}
          onPress={() => navigation.navigate('FinesList')}
        />
        <List.Item
          title="Accident Records"
          description="Damage tracking and blacklist flags"
          left={props => <List.Icon {...props} icon="car-emergency" />}
          onPress={() => navigation.navigate('AccidentsList')}
        />
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  list: { marginTop: spacing.md },
});
