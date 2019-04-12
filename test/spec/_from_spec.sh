#!/usr/bin/env bash
# Bash3 Boilerplate. Copyright (c) 2014, kvz.io

set -o errexit
set -o pipefail
set -o nounset
# set -o xtrace

# Set magic variables for current file & dir
__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
__file="${__dir}/$(basename "${BASH_SOURCE[0]}")"
__base="$(basename ${__file} .sh)"
__root="$(cd "$(dirname "${__dir}")" && pwd)" # <-- change this as it depends on your app

arg1="${1:-}"

ls $__dir | grep .*\.rq | while read file ; do
  filename="${file%.*}"
  echo $filename
  touch $__dir/$filename.spec.ts
  request_comment=$(sed 's/^/ \* /g' $__dir/$file | sed 's/\t/  /g')
  expected_output=" * TODO"
  # expected_output=$(sed 's/^/ \* /g' $__dir/$filename.srx | sed 's/\t/  /g')
  content="import * as Data from './_data';

/**
 * REQUEST: $file
 *
$request_comment
 */

describe('We should respect the $filename spec', () => {

});

/**
 * RESULTS: $filename.srx
 *
$expected_output
 */
"
  echo "$content" > $__dir/$filename.spec.ts
done