import {
  useCallback,
  useRef,
  useState,
} from 'react';

export default function useSort({ distances }) {
  const [sort, setSort] = useState({
    key: null,
    dir: 'asc',
  });

  const previousSortRef = useRef({
    key: null,
    dir: 'asc',
  });

  const compareValues = useCallback(
    (a, b, key) => {
      const read = (obj) => {
        switch (key) {
          case 'codePostal':
            return obj.codePostal ?? '';

          case 'prenom':
            return (obj.prenom ?? '').toLowerCase();

          case 'nom':
            return (obj.nom ?? '').toLowerCase();

          case 'ville':
            return (obj.ville ?? '').toLowerCase();

          case 'statut':
            return (obj.statut ?? '').toLowerCase();

          case 'distance': {
            const distance = distances.get(obj);

            return distance === '-' ||
              distance === undefined
              ? null
              : Number(distance);
          }

          default:
            return (obj[key] ?? '')
              .toString()
              .toLowerCase();
        }
      };

      const valueA = read(a);
      const valueB = read(b);

      const isEmpty = (value) =>
        value === null ||
        value === undefined ||
        value === '';

      if (isEmpty(valueA) && !isEmpty(valueB)) {
        return 1;
      }

      if (!isEmpty(valueA) && isEmpty(valueB)) {
        return -1;
      }

      if (isEmpty(valueA) && isEmpty(valueB)) {
        return 0;
      }

      if (
        typeof valueA === 'number' &&
        typeof valueB === 'number'
      ) {
        return valueA - valueB;
      }

      return String(valueA).localeCompare(
        String(valueB),
        'fr',
        {
          sensitivity: 'base',
        }
      );
    },
    [distances]
  );

  const sortList = useCallback(
    (list) => {
      if (!sort.key) return list;

      const sortedList = [...list].sort((a, b) =>
        compareValues(a, b, sort.key)
      );

      return sort.dir === 'asc'
        ? sortedList
        : sortedList.reverse();
    },
    [sort, compareValues]
  );

  const toggleSort = (key) => {
    setSort((previousSort) => ({
      key,
      dir:
        previousSort.key === key &&
        previousSort.dir === 'asc'
          ? 'desc'
          : 'asc',
    }));
  };

  const activateDistanceSort = () => {
    setSort((previousSort) => {
      if (previousSort.key !== 'distance') {
        previousSortRef.current = previousSort;
      }

      return {
        key: 'distance',
        dir: 'asc',
      };
    });
  };

  const deactivateDistanceSort = () => {
    setSort((previousSort) => {
      if (previousSort.key !== 'distance') {
        return previousSort;
      }

      return previousSortRef.current;
    });
  };

  const refreshSort = () => {
    setSort((previousSort) => ({
      ...previousSort,
    }));
  };

  return {
    sort,
    sortList,
    toggleSort,
    activateDistanceSort,
    deactivateDistanceSort,
    refreshSort,
  };
}