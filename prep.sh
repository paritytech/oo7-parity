#!/bin/bash

mode=$1

for pkg in `cat .deps`; do
	./flip.sh $pkg $mode
done

