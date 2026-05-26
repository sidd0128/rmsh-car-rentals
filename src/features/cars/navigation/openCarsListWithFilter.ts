import { useCarFilterStore, type CarFilter } from '../store/useCarFilterStore';

type NavigateToCarsList = {
  navigate: (
    screen: 'CarsTab',
    params: { screen: 'CarsList'; params: { filter: CarFilter } },
  ) => void;
};

/** Switches to Cars tab with the same filter + list behavior as CarsListScreen. */
export const openCarsListWithFilter = (
  navigation: NavigateToCarsList,
  filter: CarFilter,
): void => {
  const { setFilter, setSearchQuery } = useCarFilterStore.getState();
  setFilter(filter);
  setSearchQuery('');
  navigation.navigate('CarsTab', {
    screen: 'CarsList',
    params: { filter },
  });
};
