"use client";
import {
  Box,
  Button,
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
  Text,
} from "@chakra-ui/react";
import { LANGUAGE_VERSIONS } from "../constants";
import { Langar } from "next/font/google";
import { color } from "framer-motion";
const languages = Object.entries(LANGUAGE_VERSIONS);
const active_color = "blue.400";
const LanguageSelector = ({ language, onSelect }) => {
  return (
    <Box className=" flex items-center">
      <p className="mr-2">Language:</p>
      <MenuRoot isLazy>
        <MenuTrigger asChild>
          <Button variant="unstyled" size="sm">
            {language}
          </Button>
        </MenuTrigger>
        <MenuContent  className="absolute top-12 z-10">
          {languages.map(([lang, version]) => (
            <MenuItem
              key={lang}
              onClick={() => onSelect(lang)}
              color={lang === language ? active_color : ""}
              bg={lang === language ? "gray.900" : "transparent"}
              _hover={{
                color: active_color,
                bg: "gray.900",
              }}
            >
              {lang}
              &nbsp;
              <Text as="span" color="gray.600" fontSize="sm">
                {version}
              </Text>
            </MenuItem>
          ))}
        </MenuContent>
      </MenuRoot>
    </Box>
  );
};

export default LanguageSelector;
