import { ActionIcon, Divider, Footer, Group, Menu } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { push } from "redux-first-history";
import { Heart } from "tabler-icons-react";

import { selectAuthAccess, selectIsAuthenticated } from "../../store/auth/authSelectors";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { SUPPORT_LINK } from "../../ui-constants";
import { getNavigationItems, navigationStyles } from "./navigation";

export function FooterMenu(): JSX.Element {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const canAccess = useAppSelector(selectAuthAccess);
  const dispatch = useAppDispatch();
  const { classes } = navigationStyles();

  const matches = useMediaQuery("(min-width: 700px)");
  const { t } = useTranslation();

  if (matches) {
    return <div />;
  }

  const navigationItems = getNavigationItems(t, isAuthenticated, canAccess);

  navigationItems.push({ label: t("supportus"), link: SUPPORT_LINK, icon: Heart, color: "pink" });

  const links = navigationItems.map(item => {
    const key = item.label;

    if (item.display === false) {
      return null;
    }

    const icon = <item.icon className={classes.linkIcon} color={item.color} size={33} style={{ margin: 0 }} />;
    const link = item.submenu ? (
      <ActionIcon key={key}>{icon}</ActionIcon>
    ) : (
      <ActionIcon key={key} component={Link} to={item.link}>
        {icon}
      </ActionIcon>
    );

    if (item.submenu) {
      return (
        <Menu withArrow position="top" width={200} key={key}>
          <Menu.Target>{link}</Menu.Target>

          <Menu.Dropdown>
            {item.submenu.map(subitem => {
              const subkey = `sub-${subitem.label}`;
              if (subitem.header) {
                return <Menu.Label key={subkey}>{subitem.header}</Menu.Label>;
              }
              if (subitem.separator) {
                return <Divider key={subkey} />;
              }
              const submenuIcon = <subitem.icon size={20} color={subitem.color} />;
              return (
                <Menu.Item key={subkey} icon={submenuIcon} onClick={() => dispatch(push(subitem.link!))}>
                  {subitem.label}
                </Menu.Item>
              );
            })}
          </Menu.Dropdown>
        </Menu>
      );
    }

    return link;
  });

  return (
    <Footer height={50} p="xs">
      <Group position="apart">{links}</Group>
    </Footer>
  );
}
