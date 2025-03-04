import { Autocomplete, Group, Text, createStyles, Avatar } from "@mantine/core";
import type { AutocompleteItem } from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import { random } from "lodash";
import React, { cloneElement, forwardRef, useCallback, useEffect, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { push } from "redux-first-history";
import { Album, Map, Search, Tag, X } from "tabler-icons-react";

import { fetchPlaceAlbumsList, fetchThingAlbumsList, fetchUserAlbumsList } from "../actions/albumsActions";
import { fetchPeople } from "../actions/peopleActions";
import { searchPhotos } from "../actions/searchActions";
import { fetchExampleSearchTerms } from "../actions/utilActions";
import { useAppDispatch, useAppSelector } from "../store/store";
import { fuzzyMatch } from "../util/util";

enum SuggestionType {
  EXAMPLE,
  PLACE_ALBUM,
  THING_ALBUM,
  USER_ALBUM,
  PEOPLE
}

interface SearchSuggestion {
  value: string;
  icon: ReactNode;
  [key: string]: any;
}

function toExampleSuggestion(item: string) {
  return { value: item, type: SuggestionType.EXAMPLE };
}

function toPlaceSuggestion(item: any) {
  return { value: item.title, icon: <Map />, type: SuggestionType.PLACE_ALBUM, id: item.id };
}

function toThingSuggestion(item: any) {
  return { value: item.title, icon: <Tag />, type: SuggestionType.THING_ALBUM, id: item.id };
}

function toUserAlbumSuggestion(item: any) {
  return { value: item.title, icon: <Album />, type: SuggestionType.USER_ALBUM, id: item.id };
}

function toPeopleSuggestion(item: any) {
  return { value: item.value, icon: <Avatar src={item.face_url} alt={item.value} size="xl"/>, type: SuggestionType.PEOPLE, id: item.key };
}

const SearchSuggestionItem = forwardRef<HTMLDivElement, SearchSuggestion>(
  ({ icon = <Search />, value, ...rest }: SearchSuggestion, ref) => (
    /* eslint-disable react/jsx-props-no-spreading */
    <div ref={ref} {...rest}>
      <Group noWrap>
        {cloneElement(icon as React.ReactElement, { size: 20 })}
        <Text>{value}</Text>
      </Group>
    </div>
  )
);

export const useStyles = createStyles(() => ({
  clear: {
    color: "#333",
    cursor: "pointer",
  },
  icon: {
    color: "#333",
  },
}));

export function CustomSearch() {
  const { t } = useTranslation();
  const { classes } = useStyles();
  const { width } = useViewportSize();
  const dispatch = useAppDispatch();
  const [value, setValue] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<Array<AutocompleteItem>>([]);
  const [searchPlaceholder, setSearchPlaceholder] = useState("");
  const searchExamples = useAppSelector(store => store.util.exampleSearchTerms);
  const people = useAppSelector(store => store.people.people);
  const placeAlbums = useAppSelector(store => store.albums.albumsPlaceList);
  const thingAlbums = useAppSelector(store => store.albums.albumsThingList);
  const userAlbums = useAppSelector(store => store.albums.albumsUserList);
  const searchBarWidth = width - width / 2.2;

  const filterSearch = useCallback(
    (query: string = "") => {
      setValue(query);
      setSearchSuggestions([
        ...searchExamples
          .filter((item: string) => fuzzyMatch(query, item))
          .slice(0, 2)
          .map(toExampleSuggestion),
        ...placeAlbums
          .filter((item: any) => fuzzyMatch(query, item.title))
          .slice(0, 2)
          .map(toPlaceSuggestion),
        ...thingAlbums
          .filter((item: any) => fuzzyMatch(query, item.title))
          .slice(0, 2)
          .map(toThingSuggestion),
        ...userAlbums
          .filter((item: any) => fuzzyMatch(query, item.title))
          .slice(0, 2)
          .map(toUserAlbumSuggestion),
        ...people
          .filter((item: any) => fuzzyMatch(query, item.value))
          .slice(0, 2)
          .map(toPeopleSuggestion),
      ]);
    },
    [placeAlbums, searchExamples, thingAlbums, userAlbums, people]
  );

  function search(item: AutocompleteItem) {
    switch (item.type) {
      case undefined:
      case SuggestionType.EXAMPLE:
        dispatch(searchPhotos(item.value));
        dispatch(push("/search"));
        break;
      case SuggestionType.USER_ALBUM:
        dispatch(push(`/useralbum/${item.id}`));
        break;
      case SuggestionType.PLACE_ALBUM:
        dispatch(push(`/place/${item.id}`));
        break;
      case SuggestionType.THING_ALBUM:
        dispatch(push(`/thing/${item.id}`));
        break;
      case SuggestionType.PEOPLE:
        dispatch(push(`/person/${item.id}`));
        break;
      default:
        break;
    }
  }

  function onKeyUp(event: KeyboardEvent<HTMLInputElement>) {
    if (event.code === "Enter") {
      search({ value: event.currentTarget.value, icon: undefined });
    }
  }

  useEffect(() => {
    dispatch(fetchExampleSearchTerms());
    dispatch(fetchPlaceAlbumsList());
    dispatch(fetchThingAlbumsList());
    dispatch(fetchUserAlbumsList());
    fetchPeople(dispatch);
  }, [dispatch]);

  useEffect(() => {
    filterSearch();
  }, [searchExamples, placeAlbums, thingAlbums, userAlbums, people, filterSearch]);

  useEffect(() => {
    const interval = setInterval(() => {
      const example = searchExamples[Math.floor(random(0.1, 1) * searchExamples.length)];
      setSearchPlaceholder(`${t("search.search")} ${example}`);
    }, 5000);
    return () => clearInterval(interval);
  }, [t, searchExamples]);

  return (
    <Autocomplete
      width={searchBarWidth}
      data={searchSuggestions}
      icon={<Search size={14} className={classes.icon} />}
      placeholder={searchPlaceholder}
      itemComponent={SearchSuggestionItem}
      limit={10}
      value={value}
      onChange={e => filterSearch(e)}
      onItemSubmit={e => search(e)}
      onKeyUp={e => onKeyUp(e)}
      rightSection={
        value ? (
          <X
            className={classes.clear}
            size={13}
            onClick={() => {
              setValue("");
              filterSearch();
            }}
          />
        ) : null
      }
    />
  );
}
