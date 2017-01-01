#include <stdio.h>

int test2() {
  return 12;
}

int test2_ret() {
  puts("test2_ret is called.");
  return 4 + test2();
}