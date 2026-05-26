import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useForm } from 'react-hook-form';
import type { CarsStackParamList } from '@app/navigation/types';
import { colors, spacing } from '@app/theme';
import { currencyFieldLabel } from '@core/constants/app';
import { createId } from '@core/helpers/id';
import type { CreateCarPayload } from '@core/types/domain';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { screenStyles } from '@shared/layouts/screenStyles';
import { AppButton, ControlledAppInput } from '@shared/ui';
import { useCarStore } from '../store/useCarStore';
import { useCarFormData } from '../hooks/useCarFormData';
import { CarPhotosSection } from '../components/CarPhotosSection';

interface CarFormValues {
  name: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  numberPlate: string;
  dailyRate: string;
  notes: string;
}

export const CarFormScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<CarsStackParamList>>();
  const route = useRoute<RouteProp<CarsStackParamList, 'CarForm'>>();
  const carId = route.params?.carId;
  const { car, loading, isEdit } = useCarFormData(carId);
  const addCar = useCarStore(s => s.addCar);
  const updateCar = useCarStore(s => s.updateCar);

  const { control, handleSubmit, reset } = useForm<CarFormValues>({
    defaultValues: {
      name: '',
      brand: '',
      model: '',
      year: String(new Date().getFullYear()),
      color: '',
      numberPlate: '',
      dailyRate: '500',
      notes: '',
    },
  });

  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (car) {
      reset({
        name: car.name,
        brand: car.brand,
        model: car.model,
        year: String(car.year),
        color: car.color,
        numberPlate: car.numberPlate,
        dailyRate: String(car.priceConfigurations[0]?.dailyRate ?? 500),
        notes: car.notes ?? '',
      });
      setImages(car.images ?? []);
    }
  }, [car, reset]);

  const onSubmit = handleSubmit(async values => {
    const payload: CreateCarPayload = {
      name: values.name.trim(),
      brand: values.brand.trim(),
      model: values.model.trim(),
      year: Number(values.year),
      color: values.color.trim(),
      numberPlate: values.numberPlate.trim(),
      images,
      status: car?.status ?? 'AVAILABLE',
      priceConfigurations: [
        {
          id: car?.priceConfigurations[0]?.id ?? createId(),
          label: 'Standard',
          dailyRate: Number(values.dailyRate),
        },
      ],
      notes: values.notes,
    };

    if (car) {
      await updateCar({
        ...car,
        ...payload,
        currentBooking: car.currentBooking,
        futureBookings: car.futureBookings,
        totalEarnings: car.totalEarnings,
      });
    } else {
      await addCar(payload);
    }
    navigation.goBack();
  });

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScreenLayout contentStyle={screenStyles.formStack}>
      <CarPhotosSection images={images} onChange={setImages} />
      <View>
        <ControlledAppInput name="name" control={control} label="Car name" />
        <ControlledAppInput name="brand" control={control} label="Brand" />
        <ControlledAppInput name="model" control={control} label="Model" />
        <ControlledAppInput name="year" control={control} label="Year" keyboardType="numeric" />
        <ControlledAppInput name="color" control={control} label="Color" />
        <ControlledAppInput name="numberPlate" control={control} label="Number plate" />
        <ControlledAppInput
          name="dailyRate"
          control={control}
          label={currencyFieldLabel('Daily rate')}
          keyboardType="numeric"
        />
        <ControlledAppInput name="notes" control={control} label="Notes" multiline />
        <AppButton
          label={isEdit ? 'Save Changes' : 'Add Car'}
          onPress={onSubmit}
          fullWidth
        />
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
