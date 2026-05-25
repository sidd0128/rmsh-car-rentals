import { useEffect, useState } from 'react';
import { repositories } from '@core/database/repositoryRegistry';
import type { Car } from '@core/types/domain';
import { useCarStore } from '../store/useCarStore';

export const useCarFormData = (carId?: string) => {
  const getCarById = useCarStore(s => s.getCarById);
  const [car, setCar] = useState<Car | undefined>(carId ? getCarById(carId) : undefined);
  const [loading, setLoading] = useState(!!carId);

  useEffect(() => {
    if (!carId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const fromStore = getCarById(carId);
      if (fromStore) {
        setCar(fromStore);
        setLoading(false);
        return;
      }
      const fromRepo = await repositories.cars.getCarById(carId);
      setCar(fromRepo);
      setLoading(false);
    };

    load();
  }, [carId, getCarById]);

  return { car, loading, isEdit: !!carId };
};
